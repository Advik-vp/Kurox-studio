from __future__ import annotations

from uuid import UUID

from app.models import (
    Contact,
    Customer,
    Invoice,
    Lead,
    Project,
    Quote,
    Shoot,
    Task,
    User,
)


def user_public(user: User, role_keys: list[str] | None = None) -> dict:
    return {
        "id": str(user.id),
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "phone": user.phone,
        "avatar_url": user.avatar_url,
        "status": user.status,
        "organization_id": str(user.organization_id) if user.organization_id else None,
        "email_verified": user.email_verified_at is not None,
        "roles": role_keys or [],
    }


def customer_out(c: Customer, contacts: list[Contact] | None = None) -> dict:
    return {
        "id": str(c.id),
        "display_name": c.display_name,
        "company_name": c.company_name,
        "status": c.status,
        "website": c.website,
        "industry": c.industry,
        "assigned_user_id": str(c.assigned_user_id) if c.assigned_user_id else None,
        "tags": c.tags or [],
        "source": c.source,
        "created_at": c.created_at.isoformat() if c.created_at else None,
        "contacts": [
            {
                "id": str(x.id),
                "first_name": x.first_name,
                "last_name": x.last_name,
                "email": x.email,
                "phone": x.phone,
                "title": x.title,
                "is_primary": x.is_primary,
            }
            for x in (contacts or c.contacts or [])
        ],
    }


def lead_out(lead: Lead) -> dict:
    return {
        "id": str(lead.id),
        "company_name": lead.company_name,
        "contact_name": lead.contact_name,
        "email": lead.email,
        "phone": lead.phone,
        "source": lead.source,
        "service_interest": lead.service_interest,
        "status": lead.status,
        "assigned_user_id": str(lead.assigned_user_id) if lead.assigned_user_id else None,
        "estimated_value_minor": lead.estimated_value_minor,
        "currency": lead.currency,
        "tags": lead.tags or [],
        "converted_customer_id": str(lead.converted_customer_id) if lead.converted_customer_id else None,
        "created_at": lead.created_at.isoformat() if lead.created_at else None,
    }


def project_out(p: Project) -> dict:
    return {
        "id": str(p.id),
        "code": p.code,
        "name": p.name,
        "customer_id": str(p.customer_id),
        "customer_name": p.customer.display_name if p.customer else None,
        "project_type": p.project_type,
        "description": p.description,
        "start_date": p.start_date.isoformat() if p.start_date else None,
        "end_date": p.end_date.isoformat() if p.end_date else None,
        "budget_minor": p.budget_minor,
        "currency": p.currency,
        "manager_id": str(p.manager_id) if p.manager_id else None,
        "status": p.status,
        "priority": p.priority,
        "progress": float(p.progress or 0),
        "tags": p.tags or [],
        "quote_id": str(p.quote_id) if p.quote_id else None,
        "created_at": p.created_at.isoformat() if p.created_at else None,
    }


def task_out(t: Task) -> dict:
    return {
        "id": str(t.id),
        "title": t.title,
        "description": t.description,
        "project_id": str(t.project_id) if t.project_id else None,
        "customer_id": str(t.customer_id) if t.customer_id else None,
        "assignee_id": str(t.assignee_id) if t.assignee_id else None,
        "due_at": t.due_at.isoformat() if t.due_at else None,
        "priority": t.priority,
        "status": t.status,
        "category": t.category,
        "created_at": t.created_at.isoformat() if t.created_at else None,
    }


def shoot_out(s: Shoot) -> dict:
    return {
        "id": str(s.id),
        "project_id": str(s.project_id),
        "project_name": s.project.name if s.project else None,
        "name": s.name,
        "shoot_date": s.shoot_date.isoformat() if s.shoot_date else None,
        "call_time": s.call_time.isoformat() if s.call_time else None,
        "wrap_time": s.wrap_time.isoformat() if s.wrap_time else None,
        "location_name": s.location_name,
        "location_address": s.location_address,
        "status": s.status,
        "production_notes": s.production_notes,
        "weather": s.weather or {},
        "shots": [
            {
                "id": str(sh.id),
                "shot_code": sh.shot_code,
                "scene": sh.scene,
                "description": sh.description,
                "camera": sh.camera,
                "lens": sh.lens,
                "status": sh.status,
                "priority": sh.priority,
            }
            for sh in (s.shots or [])
        ],
        "crew": [
            {
                "id": str(c.id),
                "user_id": str(c.user_id) if c.user_id else None,
                "external_name": c.external_name,
                "crew_role": c.crew_role,
            }
            for c in (s.crew or [])
        ],
    }


def quote_out(q: Quote) -> dict:
    return {
        "id": str(q.id),
        "number": q.number,
        "customer_id": str(q.customer_id),
        "customer_name": q.customer.display_name if q.customer else None,
        "project_id": str(q.project_id) if q.project_id else None,
        "status": q.status,
        "currency": q.currency,
        "subtotal_minor": q.subtotal_minor,
        "discount_minor": q.discount_minor,
        "tax_minor": q.tax_minor,
        "total_minor": q.total_minor,
        "terms": q.terms,
        "valid_until": q.valid_until.isoformat() if q.valid_until else None,
        "converted_project_id": str(q.converted_project_id) if q.converted_project_id else None,
        "items": [
            {
                "id": str(i.id),
                "description": i.description,
                "quantity": float(i.quantity),
                "unit_price_minor": i.unit_price_minor,
                "tax_rate_bps": i.tax_rate_bps,
                "discount_minor": i.discount_minor,
            }
            for i in (q.items or [])
        ],
        "created_at": q.created_at.isoformat() if q.created_at else None,
    }


def invoice_out(inv: Invoice) -> dict:
    return {
        "id": str(inv.id),
        "number": inv.number,
        "customer_id": str(inv.customer_id),
        "customer_name": inv.customer.display_name if inv.customer else None,
        "project_id": str(inv.project_id) if inv.project_id else None,
        "status": inv.status,
        "currency": inv.currency,
        "subtotal_minor": inv.subtotal_minor,
        "discount_minor": inv.discount_minor,
        "tax_minor": inv.tax_minor,
        "total_minor": inv.total_minor,
        "amount_paid_minor": inv.amount_paid_minor,
        "due_date": inv.due_date.isoformat() if inv.due_date else None,
        "items": [
            {
                "id": str(i.id),
                "description": i.description,
                "quantity": float(i.quantity),
                "unit_price_minor": i.unit_price_minor,
                "tax_rate_bps": i.tax_rate_bps,
            }
            for i in (inv.items or [])
        ],
        "created_at": inv.created_at.isoformat() if inv.created_at else None,
    }


def parse_uuid(value: str, field: str = "id") -> UUID:
    return UUID(str(value))
