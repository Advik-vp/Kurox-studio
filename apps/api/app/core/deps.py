from __future__ import annotations

from dataclasses import dataclass
from uuid import UUID

from fastapi import Depends, Header
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.errors import AppError
from app.core.security import JWTError, decode_access
from app.db.session import get_db
from app.models import ResourceGrant, Role, RolePermission, User, UserRole, Permission

bearer = HTTPBearer(auto_error=False)


@dataclass
class TenantContext:
    user: User
    organization_id: UUID | None
    permissions: set[str]
    role_keys: list[str]


def load_permissions(db: Session, user: User) -> tuple[set[str], list[str]]:
    rows = (
        db.query(Permission.key, Role.key)
        .join(RolePermission, RolePermission.permission_id == Permission.id)
        .join(Role, Role.id == RolePermission.role_id)
        .join(UserRole, UserRole.role_id == Role.id)
        .filter(UserRole.user_id == user.id)
        .all()
    )
    perms = {r[0] for r in rows}
    roles = sorted({r[1] for r in rows})
    return perms, roles


def get_current_context(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> TenantContext:
    if creds is None:
        raise AppError("UNAUTHENTICATED", "Authentication required", 401)
    try:
        payload = decode_access(creds.credentials)
        if payload.get("type") != "access":
            raise AppError("UNAUTHENTICATED", "Invalid token", 401)
        user_id = payload.get("sub")
    except JWTError as exc:
        raise AppError("UNAUTHENTICATED", "Invalid or expired token", 401) from exc

    user = db.get(User, user_id)
    if user is None or user.deleted_at is not None or user.status == "disabled":
        raise AppError("UNAUTHENTICATED", "User not found", 401)

    perms, roles = load_permissions(db, user)
    return TenantContext(
        user=user,
        organization_id=user.organization_id,
        permissions=perms,
        role_keys=roles,
    )


def require_permission(permission: str):
    def _dep(ctx: TenantContext = Depends(get_current_context)) -> TenantContext:
        if permission not in ctx.permissions:
            raise AppError("FORBIDDEN", "You do not have permission to perform this action", 403)
        if ctx.organization_id is None:
            raise AppError("FORBIDDEN", "Organization context required", 403)
        return ctx

    return _dep


def require_org(ctx: TenantContext = Depends(get_current_context)) -> TenantContext:
    if ctx.organization_id is None:
        raise AppError("FORBIDDEN", "Organization context required", 403)
    return ctx


def client_can_access(
    db: Session, ctx: TenantContext, resource_type: str, resource_id: UUID
) -> bool:
    if "client" not in ctx.role_keys:
        return True
    grant = (
        db.query(ResourceGrant)
        .filter(
            ResourceGrant.user_id == ctx.user.id,
            ResourceGrant.resource_type == resource_type,
            ResourceGrant.resource_id == resource_id,
        )
        .first()
    )
    return grant is not None
