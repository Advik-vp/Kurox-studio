from sqlalchemy.orm import Session

from app.core.rbac import PERMISSIONS, ROLE_KEYS, ROLE_PERMISSIONS
from app.models import Permission, Role, RolePermission


def ensure_global_permissions(db: Session) -> dict[str, Permission]:
    existing = {p.key: p for p in db.query(Permission).all()}
    for key, module, desc in PERMISSIONS:
        if key not in existing:
            perm = Permission(key=key, module=module, description=desc)
            db.add(perm)
            db.flush()
            existing[key] = perm
    return existing


def ensure_org_roles(db: Session, organization_id) -> None:
    perms = ensure_global_permissions(db)
    for key in ROLE_KEYS:
        role = (
            db.query(Role)
            .filter(Role.organization_id == organization_id, Role.key == key)
            .first()
        )
        if role is None:
            role = Role(
                organization_id=organization_id,
                key=key,
                name=key.replace("_", " ").title(),
                is_system=True,
            )
            db.add(role)
            db.flush()
        wanted = set(ROLE_PERMISSIONS.get(key, []))
        have = {
            rp.permission_id
            for rp in db.query(RolePermission).filter(RolePermission.role_id == role.id).all()
        }
        for pkey in wanted:
            perm = perms.get(pkey)
            if perm and perm.id not in have:
                db.add(RolePermission(role_id=role.id, permission_id=perm.id))
