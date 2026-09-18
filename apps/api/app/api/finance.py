from datetime import date
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session, joinedload

from app.api.serializers import invoice_out, project_out, quote_out
from app.core.deps import TenantContext, require_permission
from app.core.errors import AppError, ok
from app.db.session import get_db
from app.models import (
    Customer,
    Expense,
    Invoice,
    InvoiceItem,
    Organization,
    Payment,
    Project,
    Quote,
    QuoteItem,
)
from app.services.domain import compute_line_totals, log_activity, next_counter, org_or_404

router = APIRouter(tags=["finance"])


class LineIn(BaseModel):
    description: str
    quantity: float = 1
    unit_price_minor: int
    tax_rate_bps: int = 1800
    discount_minor: int = 0


class QuoteIn(BaseModel):
    customer_id: UUID
    project_id: UUID | None = None
    terms: str = "Net 15. 50% advance to lock dates."
    valid_until: date | None = None
    client_notes: str = ""
    internal_notes: str = ""
    items: list[LineIn]


class InvoiceIn(BaseModel):
    customer_id: UUID
    project_id: UUID | None = None
    quote_id: UUID | None = None
    due_date: date | None = None
    items: list[LineIn]


class PaymentIn(BaseModel):
    amount_minor: int = Field(gt=0)
    method: str = "bank"
    provider: str | None = None
    provider_ref: str | None = None


@router.get("/quotes")
def list_quotes(
    customer_id: UUID | None = None,
    ctx: TenantContext = Depends(require_permission("quotes.read")),
    db: Session = Depends(get_db),
):
    query = (
        db.query(Quote)
        .options(joinedload(Quote.items), joinedload(Quote.customer))
        .filter(Quote.organization_id == ctx.organization_id, Quote.deleted_at.is_(None))
    )
    if customer_id:
        query = query.filter(Quote.customer_id == customer_id)
    rows = query.order_by(Quote.created_at.desc()).limit(100).all()
    return ok([quote_out(q) for q in rows])


@router.post("/quotes")
def create_quote(
    body: QuoteIn,
    ctx: TenantContext = Depends(require_permission("quotes.write")),
    db: Session = Depends(get_db),
):
    customer = (
        db.query(Customer)
        .filter(Customer.id == body.customer_id, Customer.organization_id == ctx.organization_id)
        .first()
    )
    org_or_404(customer, "CUSTOMER_NOT_FOUND", "Customer not found")
    org = db.get(Organization, ctx.organization_id)
    totals = compute_line_totals([i.model_dump() for i in body.items])
    quote = Quote(
        organization_id=ctx.organization_id,
        customer_id=body.customer_id,
        project_id=body.project_id,
        number=next_counter(db, ctx.organization_id, "quote", f"{org.invoice_prefix}-Q"),
        terms=body.terms,
        valid_until=body.valid_until,
        client_notes=body.client_notes,
        internal_notes=body.internal_notes,
        public_token=uuid4().hex,
        currency=org.currency,
        **totals,
    )
    db.add(quote)
    db.flush()
    for i, item in enumerate(body.items):
        db.add(QuoteItem(quote_id=quote.id, position=i, **item.model_dump()))
    log_activity(db, ctx.organization_id, ctx.user.id, "quote", quote.id, "created", f"Quote {quote.number} created")
    db.commit()
    quote = db.query(Quote).options(joinedload(Quote.items), joinedload(Quote.customer)).get(quote.id)
    return ok(quote_out(quote), "Quote created")


@router.get("/quotes/{quote_id}")
def get_quote(
    quote_id: UUID,
    ctx: TenantContext = Depends(require_permission("quotes.read")),
    db: Session = Depends(get_db),
):
    quote = (
        db.query(Quote)
        .options(joinedload(Quote.items), joinedload(Quote.customer))
        .filter(Quote.id == quote_id, Quote.organization_id == ctx.organization_id)
        .first()
    )
    org_or_404(quote, "QUOTE_NOT_FOUND", "Quote not found")
    return ok(quote_out(quote))


@router.post("/quotes/{quote_id}/send")
def send_quote(
    quote_id: UUID,
    ctx: TenantContext = Depends(require_permission("quotes.write")),
    db: Session = Depends(get_db),
):
    quote = db.query(Quote).filter(Quote.id == quote_id, Quote.organization_id == ctx.organization_id).first()
    org_or_404(quote, "QUOTE_NOT_FOUND", "Quote not found")
    quote.status = "sent"
    db.commit()
    return ok(quote_out(quote) if False else {"id": str(quote.id), "status": quote.status}, "Quote marked sent")


@router.post("/quotes/{quote_id}/convert-to-project")
def convert_quote(
    quote_id: UUID,
    ctx: TenantContext = Depends(require_permission("projects.write")),
    db: Session = Depends(get_db),
):
    quote = (
        db.query(Quote)
        .options(joinedload(Quote.items), joinedload(Quote.customer))
        .filter(Quote.id == quote_id, Quote.organization_id == ctx.organization_id)
        .first()
    )
    org_or_404(quote, "QUOTE_NOT_FOUND", "Quote not found")
    if quote.status not in {"approved", "sent", "viewed"}:
        raise AppError("QUOTE_NOT_CONVERTIBLE", "Quote must be sent or approved before conversion", 409)
    if quote.converted_project_id:
        project = db.get(Project, quote.converted_project_id)
        return ok(project_out(project), "Quote already converted")
    org = db.get(Organization, ctx.organization_id)
    project = Project(
        organization_id=ctx.organization_id,
        customer_id=quote.customer_id,
        quote_id=quote.id,
        code=next_counter(db, ctx.organization_id, "project", f"{org.invoice_prefix}-P"),
        name=f"{quote.customer.display_name} · {quote.number}",
        budget_minor=quote.total_minor,
        currency=quote.currency,
        status="planning",
        manager_id=ctx.user.id,
    )
    db.add(project)
    db.flush()
    quote.converted_project_id = project.id
    quote.project_id = project.id
    quote.status = "approved"
    log_activity(db, ctx.organization_id, ctx.user.id, "quote", quote.id, "converted", "Quote converted to project")
    db.commit()
    project.customer = quote.customer
    return ok(project_out(project), "Project created from quote")


@router.get("/public/quotes/{token}")
def public_quote(token: str, db: Session = Depends(get_db)):
    quote = (
        db.query(Quote)
        .options(joinedload(Quote.items), joinedload(Quote.customer))
        .filter(Quote.public_token == token, Quote.deleted_at.is_(None))
        .first()
    )
    org_or_404(quote, "QUOTE_NOT_FOUND", "Quote not found")
    if quote.status == "sent":
        quote.status = "viewed"
        db.commit()
    data = quote_out(quote)
    data.pop("internal_notes", None)
    return ok(data)


class QuoteDecision(BaseModel):
    decision: str
    comment: str | None = None


@router.post("/public/quotes/{token}/decision")
def public_quote_decision(token: str, body: QuoteDecision, db: Session = Depends(get_db)):
    quote = db.query(Quote).filter(Quote.public_token == token).first()
    org_or_404(quote, "QUOTE_NOT_FOUND", "Quote not found")
    if body.decision not in {"approved", "rejected"}:
        raise AppError("VALIDATION_ERROR", "decision must be approved or rejected", 400)
    quote.status = body.decision
    db.commit()
    return ok({"id": str(quote.id), "status": quote.status})


@router.get("/invoices")
def list_invoices(
    customer_id: UUID | None = None,
    ctx: TenantContext = Depends(require_permission("invoices.read")),
    db: Session = Depends(get_db),
):
    query = (
        db.query(Invoice)
        .options(joinedload(Invoice.items), joinedload(Invoice.customer))
        .filter(Invoice.organization_id == ctx.organization_id, Invoice.deleted_at.is_(None))
    )
    if customer_id:
        query = query.filter(Invoice.customer_id == customer_id)
    rows = query.order_by(Invoice.created_at.desc()).limit(100).all()
    return ok([invoice_out(i) for i in rows])


@router.post("/invoices")
def create_invoice(
    body: InvoiceIn,
    ctx: TenantContext = Depends(require_permission("invoices.write")),
    db: Session = Depends(get_db),
):
    customer = (
        db.query(Customer)
        .filter(Customer.id == body.customer_id, Customer.organization_id == ctx.organization_id)
        .first()
    )
    org_or_404(customer, "CUSTOMER_NOT_FOUND", "Customer not found")
    org = db.get(Organization, ctx.organization_id)
    totals = compute_line_totals([i.model_dump() for i in body.items])
    invoice = Invoice(
        organization_id=ctx.organization_id,
        customer_id=body.customer_id,
        project_id=body.project_id,
        quote_id=body.quote_id,
        number=next_counter(db, ctx.organization_id, "invoice", org.invoice_prefix),
        due_date=body.due_date,
        public_token=uuid4().hex,
        currency=org.currency,
        **totals,
    )
    db.add(invoice)
    db.flush()
    for i, item in enumerate(body.items):
        db.add(InvoiceItem(invoice_id=invoice.id, position=i, **item.model_dump()))
    log_activity(db, ctx.organization_id, ctx.user.id, "invoice", invoice.id, "created", f"Invoice {invoice.number} created")
    db.commit()
    invoice = db.query(Invoice).options(joinedload(Invoice.items), joinedload(Invoice.customer)).get(invoice.id)
    return ok(invoice_out(invoice), "Invoice created")


@router.get("/invoices/{invoice_id}")
def get_invoice(
    invoice_id: UUID,
    ctx: TenantContext = Depends(require_permission("invoices.read")),
    db: Session = Depends(get_db),
):
    invoice = (
        db.query(Invoice)
        .options(joinedload(Invoice.items), joinedload(Invoice.customer))
        .filter(Invoice.id == invoice_id, Invoice.organization_id == ctx.organization_id)
        .first()
    )
    org_or_404(invoice, "INVOICE_NOT_FOUND", "Invoice not found")
    return ok(invoice_out(invoice))


@router.post("/invoices/{invoice_id}/send")
def send_invoice(
    invoice_id: UUID,
    ctx: TenantContext = Depends(require_permission("invoices.write")),
    db: Session = Depends(get_db),
):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id, Invoice.organization_id == ctx.organization_id).first()
    org_or_404(invoice, "INVOICE_NOT_FOUND", "Invoice not found")
    invoice.status = "sent"
    db.commit()
    return ok({"id": str(invoice.id), "status": invoice.status, "number": invoice.number}, "Invoice sent")


@router.post("/invoices/{invoice_id}/payments")
def record_payment(
    invoice_id: UUID,
    body: PaymentIn,
    ctx: TenantContext = Depends(require_permission("payments.write")),
    db: Session = Depends(get_db),
):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id, Invoice.organization_id == ctx.organization_id).first()
    org_or_404(invoice, "INVOICE_NOT_FOUND", "Invoice not found")
    db.add(
        Payment(
            organization_id=ctx.organization_id,
            invoice_id=invoice.id,
            amount_minor=body.amount_minor,
            method=body.method,
            provider=body.provider,
            provider_ref=body.provider_ref,
            currency=invoice.currency,
        )
    )
    invoice.amount_paid_minor += body.amount_minor
    if invoice.amount_paid_minor >= invoice.total_minor:
        invoice.status = "paid"
    else:
        invoice.status = "partially_paid"
    log_activity(db, ctx.organization_id, ctx.user.id, "invoice", invoice.id, "payment", "Payment recorded")
    db.commit()
    return ok({"status": invoice.status, "amount_paid_minor": invoice.amount_paid_minor}, "Payment recorded")


@router.get("/payments")
def list_payments(
    ctx: TenantContext = Depends(require_permission("invoices.read")),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(Payment)
        .options(joinedload(Payment.invoice).joinedload(Invoice.customer))
        .filter(Payment.organization_id == ctx.organization_id)
        .order_by(Payment.paid_at.desc())
        .limit(200)
        .all()
    )
    return ok(
        [
            {
                "id": str(p.id),
                "invoice_id": str(p.invoice_id),
                "invoice_number": p.invoice.number if p.invoice else None,
                "customer_name": p.invoice.customer.display_name if p.invoice and p.invoice.customer else None,
                "amount_minor": p.amount_minor,
                "currency": p.currency,
                "method": p.method,
                "status": p.status,
                "paid_at": p.paid_at.isoformat() if p.paid_at else None,
            }
            for p in rows
        ]
    )


class ExpenseIn(BaseModel):
    category: str = "general"
    amount_minor: int = Field(gt=0)
    vendor: str | None = None
    incurred_on: date | None = None
    project_id: UUID | None = None
    shoot_id: UUID | None = None


@router.get("/expenses")
def list_expenses(
    ctx: TenantContext = Depends(require_permission("finance.read")),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(Expense)
        .filter(Expense.organization_id == ctx.organization_id)
        .order_by(Expense.created_at.desc())
        .limit(200)
        .all()
    )
    return ok(
        [
            {
                "id": str(e.id),
                "category": e.category,
                "amount_minor": e.amount_minor,
                "currency": e.currency,
                "vendor": e.vendor,
                "incurred_on": e.incurred_on.isoformat() if e.incurred_on else None,
                "project_id": str(e.project_id) if e.project_id else None,
                "shoot_id": str(e.shoot_id) if e.shoot_id else None,
            }
            for e in rows
        ]
    )


@router.post("/expenses")
def create_expense(
    body: ExpenseIn,
    ctx: TenantContext = Depends(require_permission("expenses.write")),
    db: Session = Depends(get_db),
):
    org = db.get(Organization, ctx.organization_id)
    row = Expense(
        organization_id=ctx.organization_id,
        created_by=ctx.user.id,
        currency=org.currency if org else "INR",
        **body.model_dump(),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return ok({"id": str(row.id), "amount_minor": row.amount_minor}, "Expense recorded")
