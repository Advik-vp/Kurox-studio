from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy.orm import Session

from app.core.errors import AppError
from app.models import Activity, AutomationAction, AutomationLog, AutomationRule, Task


PRODUCTION_CHECKLIST = [
    ("Confirm location", "production"),
    ("Confirm crew", "production"),
    ("Prepare equipment", "production"),
    ("Confirm client", "production"),
    ("Prepare shot list", "production"),
    ("Generate production checklist", "production"),
]


def log_activity(
    db: Session,
    organization_id: UUID,
    actor_id: UUID | None,
    entity_type: str,
    entity_id: UUID,
    verb: str,
    summary: str,
    meta: dict | None = None,
) -> None:
    db.add(
        Activity(
            organization_id=organization_id,
            actor_id=actor_id,
            entity_type=entity_type,
            entity_id=entity_id,
            verb=verb,
            summary=summary,
            meta=meta or {},
        )
    )


def next_counter(db: Session, organization_id: UUID, kind: str, prefix: str, year: int | None = None) -> str:
    from app.models import OrgCounter
    from sqlalchemy import select

    row = (
        db.query(OrgCounter)
        .filter(OrgCounter.organization_id == organization_id, OrgCounter.kind == kind)
        .with_for_update()
        .first()
    )
    if row is None:
        row = OrgCounter(organization_id=organization_id, kind=kind, value=0)
        db.add(row)
        db.flush()
    row.value += 1
    y = year or datetime.now(UTC).year
    return f"{prefix}-{y}-{row.value:04d}"


def compute_line_totals(items: list[dict]) -> dict[str, int]:
    subtotal = 0
    tax = 0
    discount = 0
    for item in items:
        qty = float(item.get("quantity") or 1)
        unit = int(item.get("unit_price_minor") or 0)
        line = int(round(qty * unit))
        line_disc = int(item.get("discount_minor") or 0)
        bps = int(item.get("tax_rate_bps") or 0)
        taxable = max(line - line_disc, 0)
        line_tax = int(round(taxable * bps / 10000))
        subtotal += line
        discount += line_disc
        tax += line_tax
    return {
        "subtotal_minor": subtotal,
        "discount_minor": discount,
        "tax_minor": tax,
        "total_minor": subtotal - discount + tax,
    }


def run_project_status_automations(
    db: Session, organization_id: UUID, project_id: UUID, new_status: str, actor_id: UUID | None
) -> None:
    if new_status == "production":
        existing = (
            db.query(Task)
            .filter(Task.project_id == project_id, Task.title == "Confirm location")
            .first()
        )
        if existing:
            return
        for title, category in PRODUCTION_CHECKLIST:
            db.add(
                Task(
                    organization_id=organization_id,
                    project_id=project_id,
                    title=title,
                    category=category,
                    status="todo",
                    priority="high",
                )
            )
        db.add(
            AutomationLog(
                entity_type="project",
                entity_id=project_id,
                status="ok",
                message="Created production checklist",
            )
        )
        log_activity(
            db,
            organization_id,
            actor_id,
            "project",
            project_id,
            "automation",
            "Production checklist created",
        )

    if new_status == "delivered":
        db.add(
            Task(
                organization_id=organization_id,
                project_id=project_id,
                title="Create and send invoice",
                category="finance",
                status="todo",
                priority="high",
            )
        )
        log_activity(
            db,
            organization_id,
            actor_id,
            "project",
            project_id,
            "automation",
            "Invoice reminder task created",
        )


def run_invoice_overdue(db: Session, organization_id: UUID, invoice_id: UUID, customer_id: UUID) -> None:
    db.add(
        Task(
            organization_id=organization_id,
            customer_id=customer_id,
            title="Follow up on overdue invoice",
            category="finance",
            status="todo",
            priority="urgent",
        )
    )
    log_activity(
        db,
        organization_id,
        None,
        "invoice",
        invoice_id,
        "automation",
        "Overdue follow-up task created",
    )


def org_or_404(obj, code: str = "NOT_FOUND", message: str = "Not found"):
    if obj is None:
        raise AppError(code, message, 404)
    return obj
