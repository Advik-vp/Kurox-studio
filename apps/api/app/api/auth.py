import secrets
from datetime import UTC, datetime, timedelta
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from app.api.serializers import user_public
from app.core.deps import TenantContext, get_current_context, get_db
from app.core.errors import AppError, ok
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_refresh,
    hash_password,
    hash_token,
    verify_password,
    JWTError,
)
from app.integrations.ports import email_port
from app.models import (
    EmailToken,
    Invite,
    Organization,
    RefreshToken,
    Role,
    User,
    UserRole,
)
from app.services.domain import log_activity

router = APIRouter(prefix="/auth", tags=["auth"])


class RegisterBody(BaseModel):
    organization_name: str = Field(min_length=2, max_length=200)
    first_name: str
    last_name: str
    email: EmailStr
    password: str = Field(min_length=10)


class LoginBody(BaseModel):
    email: EmailStr
    password: str


class RefreshBody(BaseModel):
    refresh_token: str


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetBody(BaseModel):
    token: str
    password: str = Field(min_length=10)


def _issue_tokens(db: Session, user: User, request: Request | None = None) -> dict:
    access = create_access_token(str(user.id), {"org": str(user.organization_id) if user.organization_id else None})
    refresh, family, expires = create_refresh_token(str(user.id))
    db.add(
        RefreshToken(
            user_id=user.id,
            family_id=UUID(family) if isinstance(family, str) else family,
            token_hash=hash_token(refresh),
            expires_at=expires,
            user_agent=request.headers.get("user-agent") if request else None,
            ip=request.client.host if request and request.client else None,
        )
    )
    return {
        "access_token": access,
        "refresh_token": refresh,
        "token_type": "bearer",
        "expires_in": 15 * 60,
    }


def _slugify(name: str) -> str:
    base = "".join(ch.lower() if ch.isalnum() else "-" for ch in name).strip("-")
    return f"{base}-{uuid4().hex[:6]}"


@router.post("/register")
def register(body: RegisterBody, request: Request, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == body.email.lower()).first()
    if existing:
        raise AppError("EMAIL_TAKEN", "An account with this email already exists", 409)

    org = Organization(name=body.organization_name, slug=_slugify(body.organization_name))
    db.add(org)
    db.flush()

    user = User(
        organization_id=org.id,
        email=body.email.lower(),
        password_hash=hash_password(body.password),
        first_name=body.first_name,
        last_name=body.last_name,
        email_verified_at=datetime.now(UTC),  # ASSUMPTION A-18: auto-verify in development starter
    )
    db.add(user)
    db.flush()

    # Attach org-scoped copies of system roles if not present
    from app.seed_rbac import ensure_org_roles

    ensure_org_roles(db, org.id)
    admin_role = db.query(Role).filter(Role.organization_id == org.id, Role.key == "admin").one()
    db.add(UserRole(user_id=user.id, role_id=admin_role.id, organization_id=org.id))
    tokens = _issue_tokens(db, user, request)
    log_activity(db, org.id, user.id, "organization", org.id, "created", "Organization created")
    db.commit()
    db.refresh(user)
    return ok(
        {"user": user_public(user, ["admin"]), "tokens": tokens, "organization": {"id": str(org.id), "name": org.name}},
        "Workspace created",
    )


@router.post("/login")
def login(body: LoginBody, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email.lower(), User.deleted_at.is_(None)).first()
    if user is None or not verify_password(body.password, user.password_hash):
        raise AppError("INVALID_CREDENTIALS", "Invalid email or password", 401)
    if user.status == "disabled":
        raise AppError("DISABLED", "Account disabled", 403)
    user.last_login_at = datetime.now(UTC)
    from app.core.deps import load_permissions

    _, roles = load_permissions(db, user)
    tokens = _issue_tokens(db, user, request)
    db.commit()
    org = db.get(Organization, user.organization_id) if user.organization_id else None
    return ok(
        {
            "user": user_public(user, roles),
            "tokens": tokens,
            "organization": {"id": str(org.id), "name": org.name, "currency": org.currency} if org else None,
        }
    )


@router.post("/refresh")
def refresh(body: RefreshBody, request: Request, db: Session = Depends(get_db)):
    try:
        payload = decode_refresh(body.refresh_token)
    except JWTError as exc:
        raise AppError("UNAUTHENTICATED", "Invalid refresh token", 401) from exc
    if payload.get("type") != "refresh":
        raise AppError("UNAUTHENTICATED", "Invalid refresh token", 401)

    user = db.get(User, payload["sub"])
    if user is None:
        raise AppError("UNAUTHENTICATED", "Invalid refresh token", 401)

    family = payload.get("fam")
    try:
        family_uuid = UUID(str(family))
    except (TypeError, ValueError) as exc:
        raise AppError("UNAUTHENTICATED", "Invalid refresh token", 401) from exc
    stored = (
        db.query(RefreshToken)
        .filter(
            RefreshToken.user_id == user.id,
            RefreshToken.family_id == family_uuid,
            RefreshToken.revoked_at.is_(None),
        )
        .all()
    )
    matched = None
    for row in stored:
        from app.core.security import verify_token_hash

        if verify_token_hash(body.refresh_token, row.token_hash):
            matched = row
            break
    if matched is None:
        db.query(RefreshToken).filter(RefreshToken.family_id == family_uuid).update(
            {"revoked_at": datetime.now(UTC)}
        )
        db.commit()
        raise AppError("UNAUTHENTICATED", "Refresh token reuse detected", 401)

    matched.revoked_at = datetime.now(UTC)
    tokens = _issue_tokens(db, user, request)
    db.commit()
    return ok({"tokens": tokens})


@router.post("/logout")
def logout(body: RefreshBody, db: Session = Depends(get_db)):
    try:
        payload = decode_refresh(body.refresh_token)
        fam = payload.get("fam")
        db.query(RefreshToken).filter(RefreshToken.family_id == UUID(str(fam))).update(
            {"revoked_at": datetime.now(UTC)}
        )
        db.commit()
    except (JWTError, ValueError, TypeError):
        pass
    return ok(message="Logged out")


@router.post("/forgot-password")
def forgot_password(body: PasswordResetRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email.lower(), User.deleted_at.is_(None)).first()
    if user:
        raw = secrets.token_urlsafe(32)
        db.add(
            EmailToken(
                user_id=user.id,
                purpose="reset",
                token_hash=hash_token(raw),
                expires_at=datetime.now(UTC) + timedelta(hours=1),
            )
        )
        db.commit()
        email_port.send(
            user.email,
            "Reset your Kurox password",
            f"Use this link within 1 hour (dev):\nhttp://localhost:5173/reset-password?token={raw}",
        )
    return ok(message="If that email exists, a reset link has been sent")


@router.post("/reset-password")
def reset_password(body: PasswordResetBody, db: Session = Depends(get_db)):
    row = (
        db.query(EmailToken)
        .filter(
            EmailToken.token_hash == hash_token(body.token),
            EmailToken.purpose == "reset",
            EmailToken.consumed_at.is_(None),
        )
        .first()
    )
    if row is None or row.expires_at < datetime.now(UTC):
        raise AppError("INVALID_TOKEN", "Reset link is invalid or expired", 400)
    user = db.get(User, row.user_id)
    if user is None:
        raise AppError("INVALID_TOKEN", "Reset link is invalid or expired", 400)
    user.password_hash = hash_password(body.password)
    row.consumed_at = datetime.now(UTC)
    db.query(RefreshToken).filter(RefreshToken.user_id == user.id, RefreshToken.revoked_at.is_(None)).update(
        {"revoked_at": datetime.now(UTC)}
    )
    db.commit()
    return ok(message="Password updated")


class InviteAcceptBody(BaseModel):
    token: str
    first_name: str
    last_name: str
    password: str = Field(min_length=10)


@router.post("/accept-invite")
def accept_invite(body: InviteAcceptBody, request: Request, db: Session = Depends(get_db)):
    invite = (
        db.query(Invite)
        .filter(Invite.token_hash == hash_token(body.token), Invite.accepted_at.is_(None))
        .first()
    )
    if invite is None or invite.expires_at < datetime.now(UTC):
        raise AppError("INVALID_TOKEN", "Invite is invalid or expired", 400)
    existing = db.query(User).filter(User.email == invite.email.lower()).first()
    if existing:
        raise AppError("EMAIL_TAKEN", "An account with this email already exists", 409)
    user = User(
        organization_id=invite.organization_id,
        email=invite.email.lower(),
        password_hash=hash_password(body.password),
        first_name=body.first_name,
        last_name=body.last_name,
        status="active",
        email_verified_at=datetime.now(UTC),
    )
    db.add(user)
    db.flush()
    role = db.query(Role).filter(Role.organization_id == invite.organization_id, Role.key == invite.role_key).one()
    db.add(UserRole(user_id=user.id, role_id=role.id, organization_id=invite.organization_id))
    invite.accepted_at = datetime.now(UTC)
    tokens = _issue_tokens(db, user, request)
    db.commit()
    return ok({"user": user_public(user, [invite.role_key]), "tokens": tokens}, "Invite accepted")


@router.get("/me")
def me(ctx: TenantContext = Depends(get_current_context), db: Session = Depends(get_db)):
    org = db.get(Organization, ctx.organization_id) if ctx.organization_id else None
    return ok(
        {
            "user": user_public(ctx.user, ctx.role_keys),
            "permissions": sorted(ctx.permissions),
            "organization": (
                {
                    "id": str(org.id),
                    "name": org.name,
                    "slug": org.slug,
                    "timezone": org.timezone,
                    "currency": org.currency,
                    "invoice_prefix": org.invoice_prefix,
                }
                if org
                else None
            ),
        }
    )
