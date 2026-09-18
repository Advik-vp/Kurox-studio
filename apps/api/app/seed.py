from datetime import UTC, date, datetime, time, timedelta
from uuid import UUID

from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.db.session import SessionLocal, engine
from app.models import (
    Activity,
    Asset,
    AutomationAction,
    AutomationRule,
    Base,
    CalendarEvent,
    Contact,
    Customer,
    Invoice,
    InvoiceItem,
    Lead,
    LeadActivity,
    MarketingCampaign,
    MarketingMetric,
    Note,
    Notification,
    Organization,
    Project,
    Quote,
    QuoteItem,
    ResourceGrant,
    Role,
    SeoKeyword,
    SeoMetric,
    SeoProject,
    Shoot,
    ShootCrew,
    Shot,
    Task,
    User,
    UserRole,
)
from app.seed_rbac import ensure_org_roles
from app.services.domain import compute_line_totals, next_counter


DEMO_PASSWORD = "Kurox!studio1"


def seed(db: Session) -> None:
    existing = db.query(Organization).filter(Organization.slug == "aperture-films").first()
    if existing:
        print("Seed already applied (aperture-films exists).")
        return

    org = Organization(
        name="Aperture Films",
        slug="aperture-films",
        timezone="Asia/Kolkata",
        currency="INR",
        invoice_prefix="AF",
        settings={"tax_rate_bps": 1800},
    )
    db.add(org)
    db.flush()
    ensure_org_roles(db, org.id)
    roles = {r.key: r for r in db.query(Role).filter(Role.organization_id == org.id).all()}

    def add_user(email: str, first: str, last: str, role_key: str) -> User:
        user = User(
            organization_id=org.id,
            email=email,
            password_hash=hash_password(DEMO_PASSWORD),
            first_name=first,
            last_name=last,
            status="active",
            email_verified_at=datetime.now(UTC),
        )
        db.add(user)
        db.flush()
        db.add(UserRole(user_id=user.id, role_id=roles[role_key].id, organization_id=org.id))
        return user

    owner = add_user("dev@aperture.kurox.dev", "Dev", "Mehra", "admin")
    pm = add_user("arjun@aperture.kurox.dev", "Arjun", "Rao", "production_manager")
    marketer = add_user("meera@aperture.kurox.dev", "Meera", "Iyer", "marketer")
    seo = add_user("kabir@aperture.kurox.dev", "Kabir", "Singh", "seo_specialist")
    finance = add_user("nisha@aperture.kurox.dev", "Nisha", "Kapoor", "accountant")
    editor = add_user("ravi@aperture.kurox.dev", "Ravi", "Nair", "team_member")
    client_user = add_user("priya@northstar.kurox.dev", "Priya", "Shah", "client")

    customer = Customer(
        organization_id=org.id,
        display_name="Northstar Brands",
        company_name="Northstar Brands Pvt Ltd",
        industry="FMCG",
        website="https://northstar.example",
        assigned_user_id=pm.id,
        tags=["retainer", "video"],
        source="referral",
        status="active",
    )
    db.add(customer)
    db.flush()
    db.add(
        Contact(
            organization_id=org.id,
            customer_id=customer.id,
            first_name="Priya",
            last_name="Shah",
            email="priya@northstar.kurox.dev",
            phone="+91 98100 00000",
            title="Brand Lead",
            is_primary=True,
        )
    )
    db.add(ResourceGrant(organization_id=org.id, user_id=client_user.id, resource_type="customer", resource_id=customer.id))

    lead = Lead(
        organization_id=org.id,
        company_name="Lumen Hospitality",
        contact_name="Aisha Khan",
        email="aisha@lumen.example",
        source="instagram",
        service_interest="brand_film",
        status="qualified",
        assigned_user_id=marketer.id,
        estimated_value_minor=85000000,
        tags=["inbound"],
    )
    db.add(lead)
    db.flush()
    db.add(
        LeadActivity(
            organization_id=org.id,
            lead_id=lead.id,
            type="call",
            body="Discovery call — wants a 60s brand film for hotel launch.",
            actor_user_id=marketer.id,
        )
    )

    items = [
        {"description": "Pre-production & creative", "quantity": 1, "unit_price_minor": 12000000, "tax_rate_bps": 1800, "discount_minor": 0},
        {"description": "2-day shoot crew + kit", "quantity": 2, "unit_price_minor": 18000000, "tax_rate_bps": 1800, "discount_minor": 0},
        {"description": "Edit, grade, sound", "quantity": 1, "unit_price_minor": 15000000, "tax_rate_bps": 1800, "discount_minor": 0},
    ]
    totals = compute_line_totals(items)
    quote = Quote(
        organization_id=org.id,
        customer_id=customer.id,
        number="AF-Q-2026-0001",
        status="approved",
        currency="INR",
        terms="Net 15. 50% advance to lock dates.",
        valid_until=date(2026, 10, 15),
        public_token="demo-quote-token",
        **totals,
    )
    db.add(quote)
    db.flush()
    for i, item in enumerate(items):
        db.add(QuoteItem(quote_id=quote.id, position=i, **item))

    project = Project(
        organization_id=org.id,
        customer_id=customer.id,
        quote_id=quote.id,
        code="AF-P-2026-0001",
        name="Northstar — Festival film",
        project_type="brand_film",
        description="Hero film + 6 social cutdowns for Diwali campaign.",
        start_date=date(2026, 9, 1),
        end_date=date(2026, 10, 20),
        budget_minor=quote.total_minor,
        currency="INR",
        manager_id=pm.id,
        status="production",
        priority="high",
        progress=42,
        tags=["diwali", "hero-film"],
    )
    db.add(project)
    db.flush()
    quote.converted_project_id = project.id
    quote.project_id = project.id
    db.add(ResourceGrant(organization_id=org.id, user_id=client_user.id, resource_type="project", resource_id=project.id))

    today = date.today()
    shoot = Shoot(
        organization_id=org.id,
        project_id=project.id,
        name="Bandra kitchen + street",
        shoot_date=today + timedelta(days=1),
        call_time=time(7, 30),
        wrap_time=time(19, 0),
        location_name="Bandra West, Mumbai",
        location_address="Linking Road staging, Unit 4",
        manager_id=pm.id,
        status="scheduled",
        production_notes="Golden hour B-roll mandatory. Client on set 11:00.",
        weather={"provider": "noop", "note": "Connect weather adapter for live forecast"},
    )
    db.add(shoot)
    db.flush()
    db.add(ShootCrew(shoot_id=shoot.id, user_id=pm.id, crew_role="production_manager"))
    db.add(ShootCrew(shoot_id=shoot.id, user_id=editor.id, crew_role="data_wrangler"))
    db.add(ShootCrew(shoot_id=shoot.id, external_name="Leela M.", crew_role="gaffer"))
    shots = [
        ("SH01", "A", "Hero pour, 35mm", "Alexa Mini", "35mm", "ready"),
        ("SH02", "A", "Hands + product insert", "Alexa Mini", "50mm", "planned"),
        ("SH03", "B", "Street wide golden hour", "FX3", "24mm", "planned"),
        ("SH04", "B", "Talent walk toward camera", "FX3", "35mm", "planned"),
    ]
    for i, (code, scene, desc, cam, lens, st) in enumerate(shots):
        db.add(
            Shot(
                organization_id=org.id,
                shoot_id=shoot.id,
                shot_code=code,
                scene=scene,
                description=desc,
                camera=cam,
                lens=lens,
                status=st,
                sort_order=i,
            )
        )
    db.add(
        CalendarEvent(
            organization_id=org.id,
            type="shoot",
            title="Shoot · Bandra kitchen + street",
            starts_at=datetime.combine(shoot.shoot_date, shoot.call_time, tzinfo=UTC),
            entity_type="shoot",
            entity_id=shoot.id,
            location=shoot.location_name,
        )
    )

    checklist = [
        ("Confirm location", "todo", "production"),
        ("Confirm crew", "in_progress", "production"),
        ("Prepare equipment", "todo", "production"),
        ("Confirm client", "completed", "production"),
        ("Prepare shot list", "in_progress", "production"),
        ("Offline assembly", "todo", "post"),
    ]
    for title, status, cat in checklist:
        db.add(
            Task(
                organization_id=org.id,
                project_id=project.id,
                customer_id=customer.id,
                title=title,
                status=status,
                category=cat,
                assignee_id=pm.id if cat == "production" else editor.id,
                due_at=datetime.now(UTC) + timedelta(days=2),
                priority="high",
            )
        )

    inv_items = items[:2]
    inv_totals = compute_line_totals(inv_items)
    invoice = Invoice(
        organization_id=org.id,
        customer_id=customer.id,
        project_id=project.id,
        quote_id=quote.id,
        number="AF-2026-0001",
        status="sent",
        due_date=today + timedelta(days=10),
        public_token="demo-invoice-token",
        currency="INR",
        **inv_totals,
    )
    db.add(invoice)
    db.flush()
    for i, item in enumerate(inv_items):
        db.add(InvoiceItem(invoice_id=invoice.id, position=i, **item))

    db.add(
        Asset(
            organization_id=org.id,
            project_id=project.id,
            customer_id=customer.id,
            type="video",
            title="Festival_film_v03.mov",
            status="client_review",
            visibility="client",
            created_by=editor.id,
        )
    )
    db.add(
        Note(
            organization_id=org.id,
            entity_type="project",
            entity_id=project.id,
            body="Client prefers warmer grade; avoid teal in night scenes.",
            is_client_visible=False,
            author_id=pm.id,
        )
    )
    db.add(
        Activity(
            organization_id=org.id,
            entity_type="project",
            entity_id=project.id,
            actor_id=pm.id,
            verb="status",
            summary="Project moved to Production",
        )
    )

    campaign = MarketingCampaign(
        organization_id=org.id,
        customer_id=customer.id,
        project_id=project.id,
        platform="meta",
        name="Northstar Diwali — Meta",
        status="draft",
        budget_minor=25000000,
        currency="INR",
        starts_on=date(2026, 10, 1),
        ends_on=date(2026, 10, 25),
    )
    db.add(campaign)
    db.flush()
    db.add(
        MarketingMetric(
            campaign_id=campaign.id,
            date=today,
            spend_minor=0,
            impressions=0,
            clicks=0,
            raw={"source": "manual_placeholder"},
        )
    )

    seo_p = SeoProject(
        organization_id=org.id,
        customer_id=customer.id,
        website_url="https://northstar.example",
        name="Northstar organic",
        status="active",
    )
    db.add(seo_p)
    db.flush()
    kw = SeoKeyword(seo_project_id=seo_p.id, keyword="premium tea gift hamper", locale="en-IN")
    db.add(kw)
    db.flush()
    db.add(SeoMetric(seo_keyword_id=kw.id, captured_on=today, position=18, clicks=40, impressions=1200, ctr=0.033, source="manual"))

    for name, trigger in [
        ("Production checklist", "project.status.production"),
        ("Invoice overdue follow-up", "invoice.overdue"),
        ("Delivered → invoice reminder", "project.status.delivered"),
    ]:
        rule = AutomationRule(organization_id=org.id, name=name, trigger_type=trigger, is_enabled=True)
        db.add(rule)
        db.flush()
        db.add(AutomationAction(rule_id=rule.id, action_type="create_tasks", params={"pack": "production"}))

    db.add(
        Notification(
            organization_id=org.id,
            user_id=pm.id,
            type="shoot_reminder",
            title="Shoot tomorrow · Bandra kitchen + street",
            body="Call time 07:30. Confirm gaffer and generator.",
            entity_type="shoot",
            entity_id=shoot.id,
        )
    )
    db.commit()
    print("Seeded Aperture Films. Password for all demo users: Kurox!studio1")


def main() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed(db)
    finally:
        db.close()


if __name__ == "__main__":
    main()
