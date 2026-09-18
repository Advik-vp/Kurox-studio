from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session, joinedload

from app.api.serializers import customer_out, lead_out
from app.core.deps import TenantContext, require_permission
from app.core.errors import AppError, ok
from app.db.session import get_db
from app.models import Activity, Contact, Customer, Lead, LeadActivity
from app.services.domain import log_activity, org_or_404

router = APIRouter(tags=["crm"])


class ContactIn(BaseModel):
    first_name: str
    last_name: str = ""
    email: EmailStr | None = None
    phone: str | None = None
    title: str | None = None
    is_primary: bool = True


class CustomerIn(BaseModel):
    display_name: str = Field(min_length=1)
    company_name: str | None = None
    website: str | None = None
    industry: str | None = None
    assigned_user_id: UUID | None = None
    tags: list[str] = []
    source: str | None = None
    primary_contact: ContactIn | None = None


class CustomerPatch(BaseModel):
    display_name: str | None = None
    company_name: str | None = None
    status: str | None = None
    website: str | None = None
    industry: str | None = None
    assigned_user_id: UUID | None = None
    tags: list[str] | None = None


class LeadIn(BaseModel):
    contact_name: str
    company_name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    source: str | None = None
    service_interest: str | None = None
    status: str = "new"
    assigned_user_id: UUID | None = None
    estimated_value_minor: int = 0
    tags: list[str] = []


class LeadPatch(BaseModel):
    contact_name: str | None = None
    company_name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    source: str | None = None
    service_interest: str | None = None
    status: str | None = None
    assigned_user_id: UUID | None = None
    estimated_value_minor: int | None = None
    lost_reason: str | None = None
    tags: list[str] | None = None


def _tenant_filter(model, org_id):
    return [model.organization_id == org_id, model.deleted_at.is_(None)]


@router.get("/customers")
def list_customers(
    q: str | None = None,
    page: int = 1,
    page_size: int = 25,
    ctx: TenantContext = Depends(require_permission("crm.read")),
    db: Session = Depends(get_db),
):
    query = db.query(Customer).options(joinedload(Customer.contacts)).filter(*_tenant_filter(Customer, ctx.organization_id))
    if q:
        like = f"%{q}%"
        query = query.filter(Customer.display_name.ilike(like))
    total = query.count()
    rows = query.order_by(Customer.updated_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return ok([customer_out(c) for c in rows], meta={"page": page, "page_size": page_size, "total": total})


@router.post("/customers")
def create_customer(
    body: CustomerIn,
    ctx: TenantContext = Depends(require_permission("crm.write")),
    db: Session = Depends(get_db),
):
    customer = Customer(
        organization_id=ctx.organization_id,
        display_name=body.display_name,
        company_name=body.company_name or body.display_name,
        website=body.website,
        industry=body.industry,
        assigned_user_id=body.assigned_user_id or ctx.user.id,
        tags=body.tags,
        source=body.source,
    )
    db.add(customer)
    db.flush()
    if body.primary_contact:
        pc = body.primary_contact
        db.add(
            Contact(
                organization_id=ctx.organization_id,
                customer_id=customer.id,
                first_name=pc.first_name,
                last_name=pc.last_name,
                email=pc.email,
                phone=pc.phone,
                title=pc.title,
                is_primary=True,
            )
        )
    log_activity(db, ctx.organization_id, ctx.user.id, "customer", customer.id, "created", f"Customer {customer.display_name} created")
    db.commit()
    db.refresh(customer)
    return ok(customer_out(customer), "Customer created successfully")


@router.get("/customers/{customer_id}")
def get_customer(
    customer_id: UUID,
    ctx: TenantContext = Depends(require_permission("crm.read")),
    db: Session = Depends(get_db),
):
    customer = (
        db.query(Customer)
        .options(joinedload(Customer.contacts))
        .filter(Customer.id == customer_id, * _tenant_filter(Customer, ctx.organization_id))
        .first()
    )
    org_or_404(customer, "CUSTOMER_NOT_FOUND", "Customer not found")
    return ok(customer_out(customer))


@router.patch("/customers/{customer_id}")
def patch_customer(
    customer_id: UUID,
    body: CustomerPatch,
    ctx: TenantContext = Depends(require_permission("crm.write")),
    db: Session = Depends(get_db),
):
    customer = db.query(Customer).filter(Customer.id == customer_id, *_tenant_filter(Customer, ctx.organization_id)).first()
    org_or_404(customer, "CUSTOMER_NOT_FOUND", "Customer not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(customer, field, value)
    db.commit()
    db.refresh(customer)
    return ok(customer_out(customer), "Customer updated")


@router.delete("/customers/{customer_id}")
def archive_customer(
    customer_id: UUID,
    ctx: TenantContext = Depends(require_permission("crm.write")),
    db: Session = Depends(get_db),
):
    from datetime import UTC, datetime

    customer = db.query(Customer).filter(Customer.id == customer_id, *_tenant_filter(Customer, ctx.organization_id)).first()
    org_or_404(customer, "CUSTOMER_NOT_FOUND", "Customer not found")
    customer.deleted_at = datetime.now(UTC)
    customer.status = "archived"
    db.commit()
    return ok(message="Customer archived")


@router.get("/leads")
def list_leads(
    status: str | None = None,
    q: str | None = None,
    page: int = 1,
    page_size: int = 25,
    ctx: TenantContext = Depends(require_permission("crm.read")),
    db: Session = Depends(get_db),
):
    query = db.query(Lead).filter(*_tenant_filter(Lead, ctx.organization_id))
    if status:
        query = query.filter(Lead.status == status)
    if q:
        query = query.filter(Lead.contact_name.ilike(f"%{q}%"))
    total = query.count()
    rows = query.order_by(Lead.updated_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return ok([lead_out(x) for x in rows], meta={"page": page, "page_size": page_size, "total": total})


@router.post("/leads")
def create_lead(
    body: LeadIn,
    ctx: TenantContext = Depends(require_permission("crm.write")),
    db: Session = Depends(get_db),
):
    lead = Lead(organization_id=ctx.organization_id, **body.model_dump())
    if lead.assigned_user_id is None:
        lead.assigned_user_id = ctx.user.id
    db.add(lead)
    db.flush()
    db.add(
        LeadActivity(
            organization_id=ctx.organization_id,
            lead_id=lead.id,
            type="status_change",
            body="Lead created",
            actor_user_id=ctx.user.id,
        )
    )
    log_activity(db, ctx.organization_id, ctx.user.id, "lead", lead.id, "created", f"Lead {lead.contact_name} created")
    db.commit()
    db.refresh(lead)
    return ok(lead_out(lead), "Lead created")


@router.get("/leads/{lead_id}")
def get_lead(
    lead_id: UUID,
    ctx: TenantContext = Depends(require_permission("crm.read")),
    db: Session = Depends(get_db),
):
    lead = db.query(Lead).filter(Lead.id == lead_id, *_tenant_filter(Lead, ctx.organization_id)).first()
    org_or_404(lead, "LEAD_NOT_FOUND", "Lead not found")
    return ok(lead_out(lead))


@router.patch("/leads/{lead_id}")
def patch_lead(
    lead_id: UUID,
    body: LeadPatch,
    ctx: TenantContext = Depends(require_permission("crm.write")),
    db: Session = Depends(get_db),
):
    lead = db.query(Lead).filter(Lead.id == lead_id, *_tenant_filter(Lead, ctx.organization_id)).first()
    org_or_404(lead, "LEAD_NOT_FOUND", "Lead not found")
    if body.status == "lost" and not body.lost_reason:
        raise AppError("VALIDATION_ERROR", "lost_reason is required when marking a lead lost", 400)
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(lead, field, value)
    db.commit()
    db.refresh(lead)
    return ok(lead_out(lead), "Lead updated")


@router.post("/leads/{lead_id}/convert")
def convert_lead(
    lead_id: UUID,
    ctx: TenantContext = Depends(require_permission("crm.write")),
    db: Session = Depends(get_db),
):
    from datetime import UTC, datetime

    lead = db.query(Lead).filter(Lead.id == lead_id, *_tenant_filter(Lead, ctx.organization_id)).first()
    org_or_404(lead, "LEAD_NOT_FOUND", "Lead not found")
    if lead.converted_customer_id:
        customer = db.get(Customer, lead.converted_customer_id)
        return ok(customer_out(customer), "Lead already converted")

    customer = Customer(
        organization_id=ctx.organization_id,
        display_name=lead.company_name or lead.contact_name,
        company_name=lead.company_name,
        assigned_user_id=lead.assigned_user_id,
        tags=lead.tags or [],
        source=lead.source,
    )
    db.add(customer)
    db.flush()
    parts = lead.contact_name.split(" ", 1)
    db.add(
        Contact(
            organization_id=ctx.organization_id,
            customer_id=customer.id,
            first_name=parts[0],
            last_name=parts[1] if len(parts) > 1 else "",
            email=lead.email,
            phone=lead.phone,
            is_primary=True,
        )
    )
    lead.status = "won"
    lead.converted_customer_id = customer.id
    lead.converted_at = datetime.now(UTC)
    log_activity(db, ctx.organization_id, ctx.user.id, "lead", lead.id, "converted", "Lead converted to customer")
    db.commit()
    db.refresh(customer)
    return ok(customer_out(customer), "Lead converted to customer")


@router.get("/contacts")
def list_contacts(
    q: str | None = None,
    ctx: TenantContext = Depends(require_permission("crm.read")),
    db: Session = Depends(get_db),
):
    query = (
        db.query(Contact)
        .options(joinedload(Contact.customer))
        .filter(Contact.organization_id == ctx.organization_id, Contact.deleted_at.is_(None))
    )
    if q:
        like = f"%{q}%"
        query = query.filter(
            (Contact.first_name.ilike(like)) | (Contact.last_name.ilike(like)) | (Contact.email.ilike(like))
        )
    rows = query.order_by(Contact.last_name, Contact.first_name).limit(200).all()
    return ok(
        [
            {
                "id": str(c.id),
                "first_name": c.first_name,
                "last_name": c.last_name,
                "email": c.email,
                "phone": c.phone,
                "title": c.title,
                "is_primary": c.is_primary,
                "customer_id": str(c.customer_id),
                "customer_name": c.customer.display_name if c.customer else None,
            }
            for c in rows
        ]
    )


@router.get("/activities")
def list_activities(
    entity_type: str | None = None,
    entity_id: UUID | None = None,
    ctx: TenantContext = Depends(require_permission("crm.read")),
    db: Session = Depends(get_db),
):
    query = db.query(Activity).filter(Activity.organization_id == ctx.organization_id)
    if entity_type:
        query = query.filter(Activity.entity_type == entity_type)
    if entity_id:
        query = query.filter(Activity.entity_id == entity_id)
    rows = query.order_by(Activity.created_at.desc()).limit(100).all()
    return ok(
        [
            {
                "id": str(a.id),
                "entity_type": a.entity_type,
                "entity_id": str(a.entity_id),
                "verb": a.verb,
                "summary": a.summary,
                "created_at": a.created_at.isoformat() if a.created_at else None,
            }
            for a in rows
        ]
    )
