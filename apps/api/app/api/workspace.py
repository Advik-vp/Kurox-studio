from datetime import UTC, date, datetime, timedelta
from uuid import UUID
import secrets

from fastapi import APIRouter, Depends
from pydantic import BaseModel, EmailStr
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.deps import TenantContext, require_org, require_permission
from app.core.errors import AppError, ok
from app.core.security import hash_token
from app.db.session import get_db
from app.integrations.ports import email_port, payment_port, storage_port
from app.models import (
    Activity,
    Asset,
    AutomationRule,
    CalendarEvent,
    Invoice,
    Invite,
    Lead,
    MarketingCampaign,
    Note,
    Notification,
    Project,
    Quote,
    SeoProject,
    Shoot,
    Task,
    User,
)
from app.services.domain import log_activity

router = APIRouter(tags=["workspace"])


class NoteIn(BaseModel):
    entity_type: str
    entity_id: UUID
    body: str
    is_client_visible: bool = False


class EventIn(BaseModel):
    type: str
    title: str
    starts_at: datetime
    ends_at: datetime | None = None
    all_day: bool = False
    location: str | None = None
    entity_type: str | None = None
    entity_id: UUID | None = None


class CampaignIn(BaseModel):
    name: str
    platform: str = "other"
    customer_id: UUID | None = None
    project_id: UUID | None = None
    budget_minor: int = 0
    status: str = "draft"


class SeoProjectIn(BaseModel):
    name: str
    website_url: str
    customer_id: UUID


@router.get("/analytics/dashboard")
def dashboard(
    ctx: TenantContext = Depends(require_org),
    db: Session = Depends(get_db),
):
    org = ctx.organization_id
    active_projects = (
        db.query(func.count(Project.id))
        .filter(
            Project.organization_id == org,
            Project.deleted_at.is_(None),
            Project.status.notin_(["completed", "cancelled"]),
        )
        .scalar()
        or 0
    )
    today = date.today()
    upcoming_shoots = (
        db.query(func.count(Shoot.id))
        .filter(
            Shoot.organization_id == org,
            Shoot.deleted_at.is_(None),
            Shoot.shoot_date >= today,
            Shoot.status != "cancelled",
        )
        .scalar()
        or 0
    )
    open_leads = (
        db.query(func.count(Lead.id))
        .filter(Lead.organization_id == org, Lead.deleted_at.is_(None), Lead.status.notin_(["won", "lost"]))
        .scalar()
        or 0
    )
    revenue = (
        db.query(func.coalesce(func.sum(Invoice.amount_paid_minor), 0))
        .filter(Invoice.organization_id == org, Invoice.deleted_at.is_(None))
        .scalar()
        or 0
    )
    outstanding = (
        db.query(func.coalesce(func.sum(Invoice.total_minor - Invoice.amount_paid_minor), 0))
        .filter(
            Invoice.organization_id == org,
            Invoice.deleted_at.is_(None),
            Invoice.status.in_(["sent", "partially_paid", "overdue"]),
        )
        .scalar()
        or 0
    )
    due_tasks = (
        db.query(func.count(Task.id))
        .filter(Task.organization_id == org, Task.deleted_at.is_(None), Task.status != "completed")
        .scalar()
        or 0
    )
    pipeline = (
        db.query(Project.status, func.count(Project.id))
        .filter(Project.organization_id == org, Project.deleted_at.is_(None))
        .group_by(Project.status)
        .all()
    )
    tasks = (
        db.query(Task)
        .filter(Task.organization_id == org, Task.deleted_at.is_(None), Task.status != "completed")
        .order_by(Task.due_at.nulls_last())
        .limit(8)
        .all()
    )
    shoots = (
        db.query(Shoot)
        .filter(Shoot.organization_id == org, Shoot.deleted_at.is_(None), Shoot.shoot_date >= today)
        .order_by(Shoot.shoot_date)
        .limit(6)
        .all()
    )
    activity = (
        db.query(Activity)
        .filter(Activity.organization_id == org)
        .order_by(Activity.created_at.desc())
        .limit(10)
        .all()
    )
    lead_counts = (
        db.query(Lead.status, func.count(Lead.id))
        .filter(Lead.organization_id == org, Lead.deleted_at.is_(None))
        .group_by(Lead.status)
        .all()
    )
    return ok(
        {
            "kpis": {
                "active_projects": active_projects,
                "upcoming_shoots": upcoming_shoots,
                "open_leads": open_leads if "crm.read" in ctx.permissions else 0,
                "revenue_minor": int(revenue)
                if "finance.read" in ctx.permissions or "analytics.read" in ctx.permissions
                else 0,
                "outstanding_minor": int(outstanding)
                if "finance.read" in ctx.permissions or "analytics.read" in ctx.permissions
                else 0,
                "open_tasks": due_tasks,
            },
            "pipeline": [{"status": s, "count": c} for s, c in pipeline],
            "lead_pipeline": [{"status": s, "count": c} for s, c in lead_counts],
            "tasks": [
                {
                    "id": str(t.id),
                    "title": t.title,
                    "due_at": t.due_at.isoformat() if t.due_at else None,
                    "priority": t.priority,
                    "status": t.status,
                }
                for t in tasks
            ],
            "shoots": [
                {
                    "id": str(s.id),
                    "name": s.name,
                    "shoot_date": s.shoot_date.isoformat() if s.shoot_date else None,
                    "location_name": s.location_name,
                    "status": s.status,
                }
                for s in shoots
            ],
            "activity": [
                {
                    "id": str(a.id),
                    "summary": a.summary,
                    "verb": a.verb,
                    "entity_type": a.entity_type,
                    "created_at": a.created_at.isoformat() if a.created_at else None,
                }
                for a in activity
            ],
            "marketing": {
                "connected": False,
                "unavailable_reason": "Ads adapters are NoOp until Phase 3",
            },
            "seo": {
                "connected": False,
                "unavailable_reason": "Search Console adapter is NoOp until Phase 3",
            },
        }
    )


@router.get("/calendar/events")
def calendar_events(
    ctx: TenantContext = Depends(require_permission("calendar.read")),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(CalendarEvent)
        .filter(CalendarEvent.organization_id == ctx.organization_id)
        .order_by(CalendarEvent.starts_at)
        .limit(200)
        .all()
    )
    return ok(
        [
            {
                "id": str(e.id),
                "type": e.type,
                "title": e.title,
                "starts_at": e.starts_at.isoformat(),
                "ends_at": e.ends_at.isoformat() if e.ends_at else None,
                "location": e.location,
                "entity_type": e.entity_type,
                "entity_id": str(e.entity_id) if e.entity_id else None,
            }
            for e in rows
        ]
    )


@router.post("/calendar/events")
def create_event(
    body: EventIn,
    ctx: TenantContext = Depends(require_permission("calendar.write")),
    db: Session = Depends(get_db),
):
    event = CalendarEvent(organization_id=ctx.organization_id, **body.model_dump())
    db.add(event)
    db.commit()
    db.refresh(event)
    return ok({"id": str(event.id), "title": event.title}, "Event created")


@router.post("/notes")
def create_note(
    body: NoteIn,
    ctx: TenantContext = Depends(require_permission("notes.write")),
    db: Session = Depends(get_db),
):
    if "client" in ctx.role_keys:
        body.is_client_visible = True
    note = Note(
        organization_id=ctx.organization_id,
        author_id=ctx.user.id,
        **body.model_dump(),
    )
    db.add(note)
    db.commit()
    return ok({"id": str(note.id)}, "Note added")


@router.get("/notes")
def list_notes(
    entity_type: str,
    entity_id: UUID,
    ctx: TenantContext = Depends(require_org),
    db: Session = Depends(get_db),
):
    query = db.query(Note).filter(
        Note.organization_id == ctx.organization_id,
        Note.entity_type == entity_type,
        Note.entity_id == entity_id,
    )
    if "client" in ctx.role_keys:
        query = query.filter(Note.is_client_visible.is_(True))
    rows = query.order_by(Note.created_at.desc()).limit(50).all()
    return ok(
        [
            {
                "id": str(n.id),
                "body": n.body,
                "is_client_visible": n.is_client_visible,
                "created_at": n.created_at.isoformat() if n.created_at else None,
            }
            for n in rows
        ]
    )


@router.get("/notifications")
def notifications(ctx: TenantContext = Depends(require_org), db: Session = Depends(get_db)):
    rows = (
        db.query(Notification)
        .filter(Notification.user_id == ctx.user.id)
        .order_by(Notification.created_at.desc())
        .limit(30)
        .all()
    )
    return ok(
        [
            {
                "id": str(n.id),
                "type": n.type,
                "title": n.title,
                "body": n.body,
                "read_at": n.read_at.isoformat() if n.read_at else None,
                "created_at": n.created_at.isoformat() if n.created_at else None,
            }
            for n in rows
        ]
    )


@router.get("/marketing/campaigns")
def campaigns(
    ctx: TenantContext = Depends(require_permission("marketing.read")),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(MarketingCampaign)
        .filter(MarketingCampaign.organization_id == ctx.organization_id)
        .all()
    )
    return ok(
        {
            "items": [
                {
                    "id": str(c.id),
                    "name": c.name,
                    "platform": c.platform,
                    "status": c.status,
                    "budget_minor": c.budget_minor,
                }
                for c in rows
            ],
            "integration": {"connected": False, "provider": "noop"},
        }
    )


@router.post("/marketing/campaigns")
def create_campaign(
    body: CampaignIn,
    ctx: TenantContext = Depends(require_permission("marketing.write")),
    db: Session = Depends(get_db),
):
    row = MarketingCampaign(organization_id=ctx.organization_id, **body.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return ok({"id": str(row.id), "name": row.name}, "Campaign created")


@router.get("/seo/projects")
def seo_projects(
    ctx: TenantContext = Depends(require_permission("seo.read")),
    db: Session = Depends(get_db),
):
    rows = db.query(SeoProject).filter(SeoProject.organization_id == ctx.organization_id).all()
    return ok(
        {
            "items": [
                {"id": str(p.id), "name": p.name, "website_url": p.website_url, "status": p.status}
                for p in rows
            ],
            "integration": {"connected": False, "provider": "noop"},
        }
    )


@router.post("/seo/projects")
def create_seo_project(
    body: SeoProjectIn,
    ctx: TenantContext = Depends(require_permission("seo.write")),
    db: Session = Depends(get_db),
):
    row = SeoProject(organization_id=ctx.organization_id, **body.model_dump())
    db.add(row)
    db.commit()
    return ok({"id": str(row.id), "name": row.name}, "SEO project created")


@router.get("/assets")
def assets(
    project_id: UUID | None = None,
    ctx: TenantContext = Depends(require_permission("assets.read")),
    db: Session = Depends(get_db),
):
    query = db.query(Asset).filter(Asset.organization_id == ctx.organization_id, Asset.deleted_at.is_(None))
    if project_id:
        query = query.filter(Asset.project_id == project_id)
    if "client" in ctx.role_keys:
        query = query.filter(Asset.status.in_(["client_review", "approved", "delivered"]))
    rows = query.order_by(Asset.created_at.desc()).limit(100).all()
    return ok(
        [
            {
                "id": str(a.id),
                "title": a.title,
                "type": a.type,
                "status": a.status,
                "project_id": str(a.project_id) if a.project_id else None,
            }
            for a in rows
        ]
    )


@router.post("/assets/uploads")
def asset_upload_intent(
    body: dict,
    ctx: TenantContext = Depends(require_permission("assets.write")),
    db: Session = Depends(get_db),
):
    asset = Asset(
        organization_id=ctx.organization_id,
        project_id=body.get("project_id"),
        title=body.get("filename") or "Untitled",
        mime=body.get("mime"),
        size_bytes=body.get("size") or 0,
        type=body.get("type") or "document",
        storage_key=f"{ctx.organization_id}/{body.get('filename')}",
        created_by=ctx.user.id,
        status="uploaded",
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)
    upload = storage_port.presign_put(asset.storage_key, asset.mime or "application/octet-stream")
    return ok({"asset": {"id": str(asset.id), "status": asset.status}, "upload": upload})


@router.get("/automation/rules")
def automation_rules(
    ctx: TenantContext = Depends(require_permission("automation.read")),
    db: Session = Depends(get_db),
):
    rows = db.query(AutomationRule).filter(AutomationRule.organization_id == ctx.organization_id).all()
    return ok(
        [
            {
                "id": str(r.id),
                "name": r.name,
                "trigger_type": r.trigger_type,
                "is_enabled": r.is_enabled,
            }
            for r in rows
        ]
    )


@router.get("/users")
def list_users(
    ctx: TenantContext = Depends(require_permission("team.read")),
    db: Session = Depends(get_db),
):
    from app.core.deps import load_permissions
    from app.api.serializers import user_public

    rows = db.query(User).filter(User.organization_id == ctx.organization_id, User.deleted_at.is_(None)).all()
    out = []
    for u in rows:
        _, roles = load_permissions(db, u)
        out.append(user_public(u, roles))
    return ok(out)


class InviteIn(BaseModel):
    email: EmailStr
    role_key: str = "team_member"


@router.post("/users/invites")
def invite_user(
    body: InviteIn,
    ctx: TenantContext = Depends(require_permission("team.invite")),
    db: Session = Depends(get_db),
):
    from app.core.rbac import ROLE_KEYS

    if body.role_key not in ROLE_KEYS or body.role_key in {"admin"} and "admin" not in ctx.role_keys:
        raise AppError("VALIDATION_ERROR", "Invalid role", 400)
    if body.role_key == "admin" and "admin" not in ctx.role_keys:
        raise AppError("FORBIDDEN", "You do not have permission to perform this action", 403)
    existing = db.query(User).filter(User.email == body.email.lower()).first()
    if existing:
        raise AppError("EMAIL_TAKEN", "An account with this email already exists", 409)
    raw = secrets.token_urlsafe(24)
    invite = Invite(
        organization_id=ctx.organization_id,
        email=body.email.lower(),
        role_key=body.role_key,
        invited_by=ctx.user.id,
        token_hash=hash_token(raw),
        expires_at=datetime.now(UTC) + timedelta(days=3),
    )
    db.add(invite)
    db.commit()
    email_port.send(
        body.email,
        "You are invited to Kurox",
        f"Join {ctx.user.first_name}'s studio. Dev accept URL:\n"
        f"http://localhost:5173/accept-invite?token={raw}\nRole: {body.role_key}",
    )
    return ok({"email": body.email.lower(), "role_key": body.role_key, "dev_token": raw}, "Invite sent")


class AssetDecision(BaseModel):
    comment: str | None = None


@router.post("/assets/{asset_id}/approve")
def approve_asset(
    asset_id: UUID,
    body: AssetDecision | None = None,
    ctx: TenantContext = Depends(require_permission("assets.approve")),
    db: Session = Depends(get_db),
):
    from app.core.deps import client_can_access
    from app.services.domain import log_activity

    asset = db.query(Asset).filter(Asset.id == asset_id, Asset.organization_id == ctx.organization_id).first()
    if asset is None:
        raise AppError("ASSET_NOT_FOUND", "Asset not found", 404)
    if "client" in ctx.role_keys:
        if asset.project_id and not client_can_access(db, ctx, "project", asset.project_id):
            raise AppError("ASSET_NOT_FOUND", "Asset not found", 404)
        if asset.status not in {"client_review"}:
            raise AppError("FORBIDDEN", "You do not have permission to perform this action", 403)
    asset.status = "approved"
    log_activity(db, ctx.organization_id, ctx.user.id, "asset", asset.id, "approved", "Deliverable approved")
    db.commit()
    return ok({"id": str(asset.id), "status": asset.status}, "Asset approved")


@router.post("/assets/{asset_id}/request-changes")
def request_asset_changes(
    asset_id: UUID,
    body: AssetDecision,
    ctx: TenantContext = Depends(require_permission("assets.approve")),
    db: Session = Depends(get_db),
):
    from app.core.deps import client_can_access
    from app.services.domain import log_activity

    if not (body.comment or "").strip():
        raise AppError("VALIDATION_ERROR", "Comment is required when requesting changes", 400)
    asset = db.query(Asset).filter(Asset.id == asset_id, Asset.organization_id == ctx.organization_id).first()
    if asset is None:
        raise AppError("ASSET_NOT_FOUND", "Asset not found", 404)
    if "client" in ctx.role_keys and asset.project_id and not client_can_access(db, ctx, "project", asset.project_id):
        raise AppError("ASSET_NOT_FOUND", "Asset not found", 404)
    asset.status = "internal_review"
    log_activity(
        db,
        ctx.organization_id,
        ctx.user.id,
        "asset",
        asset.id,
        "changes_requested",
        body.comment.strip(),
    )
    db.commit()
    return ok({"id": str(asset.id), "status": asset.status}, "Changes requested")


@router.get("/payments/checkout-preview/{invoice_id}")
def checkout_preview(
    invoice_id: str,
    ctx: TenantContext = Depends(require_permission("invoices.read")),
):
    return ok(payment_port.create_checkout(invoice_id, 0, "INR"))
