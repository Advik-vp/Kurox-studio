from datetime import date, time
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session, joinedload

from app.api.serializers import project_out, shoot_out, task_out
from app.core.deps import TenantContext, client_can_access, require_permission
from app.core.errors import AppError, ok
from app.db.session import get_db
from app.models import CalendarEvent, Customer, Project, Shoot, ShootCrew, Shot, Task
from app.services.domain import log_activity, next_counter, org_or_404, run_project_status_automations

router = APIRouter(tags=["production"])


class ProjectIn(BaseModel):
    customer_id: UUID
    name: str
    project_type: str = "commercial"
    description: str = ""
    start_date: date | None = None
    end_date: date | None = None
    budget_minor: int = 0
    manager_id: UUID | None = None
    priority: str = "medium"
    tags: list[str] = []


class ProjectPatch(BaseModel):
    name: str | None = None
    description: str | None = None
    status: str | None = None
    priority: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    budget_minor: int | None = None
    manager_id: UUID | None = None
    progress: float | None = None
    tags: list[str] | None = None


class TaskIn(BaseModel):
    title: str
    description: str = ""
    project_id: UUID | None = None
    customer_id: UUID | None = None
    assignee_id: UUID | None = None
    due_at: str | None = None
    priority: str = "medium"
    status: str = "todo"
    category: str = "general"


class TaskPatch(BaseModel):
    title: str | None = None
    description: str | None = None
    assignee_id: UUID | None = None
    due_at: str | None = None
    priority: str | None = None
    status: str | None = None
    category: str | None = None


class ShootIn(BaseModel):
    project_id: UUID
    name: str
    shoot_date: date | None = None
    call_time: time | None = None
    wrap_time: time | None = None
    location_name: str | None = None
    location_address: str | None = None
    production_notes: str = ""
    status: str = "planning"
    crew: list[dict] = []
    shots: list[dict] = []


class ShotPatch(BaseModel):
    description: str | None = None
    camera: str | None = None
    lens: str | None = None
    status: str | None = None
    priority: str | None = None
    notes: str | None = None
    talent: str | None = None
    props: str | None = None


@router.get("/projects")
def list_projects(
    status: str | None = None,
    customer_id: UUID | None = None,
    q: str | None = None,
    page: int = 1,
    page_size: int = 25,
    ctx: TenantContext = Depends(require_permission("projects.read")),
    db: Session = Depends(get_db),
):
    query = (
        db.query(Project)
        .options(joinedload(Project.customer))
        .filter(Project.organization_id == ctx.organization_id, Project.deleted_at.is_(None))
    )
    if status:
        query = query.filter(Project.status == status)
    if customer_id:
        query = query.filter(Project.customer_id == customer_id)
    if q:
        query = query.filter(Project.name.ilike(f"%{q}%"))
    if "client" in ctx.role_keys:
        from app.models import ResourceGrant

        granted = [
            g.resource_id
            for g in db.query(ResourceGrant).filter(
                ResourceGrant.user_id == ctx.user.id, ResourceGrant.resource_type == "project"
            )
        ]
        query = query.filter(Project.id.in_(granted or [UUID("00000000-0000-0000-0000-000000000000")]))
    total = query.count()
    rows = query.order_by(Project.updated_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return ok([project_out(p) for p in rows], meta={"page": page, "page_size": page_size, "total": total})


@router.post("/projects")
def create_project(
    body: ProjectIn,
    ctx: TenantContext = Depends(require_permission("projects.write")),
    db: Session = Depends(get_db),
):
    customer = (
        db.query(Customer)
        .filter(Customer.id == body.customer_id, Customer.organization_id == ctx.organization_id)
        .first()
    )
    org_or_404(customer, "CUSTOMER_NOT_FOUND", "Customer not found")
    org = ctx.user.organization
    prefix = org.invoice_prefix if org else "KX"
    from app.models import Organization

    org_row = db.get(Organization, ctx.organization_id)
    code = next_counter(db, ctx.organization_id, "project", f"{org_row.invoice_prefix}-P")
    project = Project(
        organization_id=ctx.organization_id,
        code=code,
        **body.model_dump(),
    )
    db.add(project)
    db.flush()
    log_activity(db, ctx.organization_id, ctx.user.id, "project", project.id, "created", f"Project {project.name} created")
    db.commit()
    db.refresh(project)
    project.customer = customer
    return ok(project_out(project), "Project created successfully")


@router.get("/projects/{project_id}")
def get_project(
    project_id: UUID,
    ctx: TenantContext = Depends(require_permission("projects.read")),
    db: Session = Depends(get_db),
):
    project = (
        db.query(Project)
        .options(joinedload(Project.customer))
        .filter(Project.id == project_id, Project.organization_id == ctx.organization_id, Project.deleted_at.is_(None))
        .first()
    )
    org_or_404(project, "PROJECT_NOT_FOUND", "Project not found")
    if not client_can_access(db, ctx, "project", project.id):
        raise AppError("PROJECT_NOT_FOUND", "Project not found", 404)
    return ok(project_out(project))


@router.patch("/projects/{project_id}")
def patch_project(
    project_id: UUID,
    body: ProjectPatch,
    ctx: TenantContext = Depends(require_permission("projects.write")),
    db: Session = Depends(get_db),
):
    project = (
        db.query(Project)
        .options(joinedload(Project.customer))
        .filter(Project.id == project_id, Project.organization_id == ctx.organization_id, Project.deleted_at.is_(None))
        .first()
    )
    org_or_404(project, "PROJECT_NOT_FOUND", "Project not found")
    data = body.model_dump(exclude_unset=True)
    new_status = data.get("status")
    for field, value in data.items():
        setattr(project, field, value)
    if new_status:
        run_project_status_automations(db, ctx.organization_id, project.id, new_status, ctx.user.id)
        log_activity(db, ctx.organization_id, ctx.user.id, "project", project.id, "status", f"Status → {new_status}")
    db.commit()
    db.refresh(project)
    return ok(project_out(project), "Project updated")


@router.get("/tasks")
def list_tasks(
    project_id: UUID | None = None,
    status: str | None = None,
    assignee_id: UUID | None = None,
    ctx: TenantContext = Depends(require_permission("tasks.read")),
    db: Session = Depends(get_db),
):
    query = db.query(Task).filter(Task.organization_id == ctx.organization_id, Task.deleted_at.is_(None))
    if project_id:
        query = query.filter(Task.project_id == project_id)
    if status:
        query = query.filter(Task.status == status)
    if assignee_id:
        query = query.filter(Task.assignee_id == assignee_id)
    rows = query.order_by(Task.due_at.nulls_last(), Task.created_at.desc()).limit(200).all()
    return ok([task_out(t) for t in rows])


@router.post("/tasks")
def create_task(
    body: TaskIn,
    ctx: TenantContext = Depends(require_permission("tasks.write")),
    db: Session = Depends(get_db),
):
    from datetime import datetime

    payload = body.model_dump()
    due = payload.pop("due_at")
    task = Task(organization_id=ctx.organization_id, **payload)
    if due:
        task.due_at = datetime.fromisoformat(due.replace("Z", "+00:00"))
    db.add(task)
    db.flush()
    log_activity(db, ctx.organization_id, ctx.user.id, "task", task.id, "created", f"Task {task.title} created")
    db.commit()
    db.refresh(task)
    return ok(task_out(task), "Task created")


@router.patch("/tasks/{task_id}")
def patch_task(
    task_id: UUID,
    body: TaskPatch,
    ctx: TenantContext = Depends(require_permission("tasks.write")),
    db: Session = Depends(get_db),
):
    from datetime import datetime

    task = db.query(Task).filter(Task.id == task_id, Task.organization_id == ctx.organization_id).first()
    org_or_404(task, "TASK_NOT_FOUND", "Task not found")
    data = body.model_dump(exclude_unset=True)
    due = data.pop("due_at", None)
    for field, value in data.items():
        setattr(task, field, value)
    if due:
        task.due_at = datetime.fromisoformat(due.replace("Z", "+00:00"))
    db.commit()
    db.refresh(task)
    return ok(task_out(task), "Task updated")


@router.get("/shoots")
def list_shoots(
    project_id: UUID | None = None,
    ctx: TenantContext = Depends(require_permission("shoots.read")),
    db: Session = Depends(get_db),
):
    query = (
        db.query(Shoot)
        .options(joinedload(Shoot.project), joinedload(Shoot.shots), joinedload(Shoot.crew))
        .filter(Shoot.organization_id == ctx.organization_id, Shoot.deleted_at.is_(None))
    )
    if project_id:
        query = query.filter(Shoot.project_id == project_id)
    rows = query.order_by(Shoot.shoot_date.nulls_last()).limit(200).all()
    return ok([shoot_out(s) for s in rows])


@router.post("/shoots")
def create_shoot(
    body: ShootIn,
    ctx: TenantContext = Depends(require_permission("shoots.write")),
    db: Session = Depends(get_db),
):
    project = (
        db.query(Project)
        .filter(Project.id == body.project_id, Project.organization_id == ctx.organization_id)
        .first()
    )
    org_or_404(project, "PROJECT_NOT_FOUND", "Project not found")
    data = body.model_dump(exclude={"crew", "shots"})
    shoot = Shoot(organization_id=ctx.organization_id, manager_id=ctx.user.id, **data)
    if shoot.shoot_date and shoot.location_name and shoot.status == "planning":
        shoot.status = "scheduled"
    db.add(shoot)
    db.flush()
    for i, shot in enumerate(body.shots):
        db.add(
            Shot(
                organization_id=ctx.organization_id,
                shoot_id=shoot.id,
                shot_code=shot.get("shot_code") or f"SH{i+1:02d}",
                scene=shot.get("scene"),
                description=shot.get("description", ""),
                camera=shot.get("camera"),
                lens=shot.get("lens"),
                talent=shot.get("talent"),
                props=shot.get("props"),
                priority=shot.get("priority", "medium"),
                status=shot.get("status", "planned"),
                sort_order=i,
            )
        )
    for member in body.crew:
        db.add(
            ShootCrew(
                shoot_id=shoot.id,
                user_id=member.get("user_id"),
                external_name=member.get("external_name"),
                crew_role=member.get("crew_role", "crew"),
            )
        )
    if shoot.shoot_date:
        from datetime import datetime, timezone

        start = datetime.combine(shoot.shoot_date, shoot.call_time or time(9, 0), tzinfo=timezone.utc)
        db.add(
            CalendarEvent(
                organization_id=ctx.organization_id,
                type="shoot",
                title=f"Shoot · {shoot.name}",
                starts_at=start,
                entity_type="shoot",
                entity_id=shoot.id,
                location=shoot.location_name,
            )
        )
    log_activity(db, ctx.organization_id, ctx.user.id, "shoot", shoot.id, "created", f"Shoot {shoot.name} created")
    db.commit()
    shoot = (
        db.query(Shoot)
        .options(joinedload(Shoot.project), joinedload(Shoot.shots), joinedload(Shoot.crew))
        .get(shoot.id)
    )
    return ok(shoot_out(shoot), "Shoot created")


@router.get("/shoots/{shoot_id}")
def get_shoot(
    shoot_id: UUID,
    ctx: TenantContext = Depends(require_permission("shoots.read")),
    db: Session = Depends(get_db),
):
    shoot = (
        db.query(Shoot)
        .options(joinedload(Shoot.project), joinedload(Shoot.shots), joinedload(Shoot.crew))
        .filter(Shoot.id == shoot_id, Shoot.organization_id == ctx.organization_id)
        .first()
    )
    org_or_404(shoot, "SHOOT_NOT_FOUND", "Shoot not found")
    return ok(shoot_out(shoot))


@router.patch("/shoots/{shoot_id}")
def patch_shoot(
    shoot_id: UUID,
    body: dict,
    ctx: TenantContext = Depends(require_permission("shoots.write")),
    db: Session = Depends(get_db),
):
    shoot = db.query(Shoot).filter(Shoot.id == shoot_id, Shoot.organization_id == ctx.organization_id).first()
    org_or_404(shoot, "SHOOT_NOT_FOUND", "Shoot not found")
    allowed = {
        "name",
        "status",
        "location_name",
        "location_address",
        "production_notes",
        "shoot_date",
        "call_time",
        "wrap_time",
    }
    for key, value in body.items():
        if key in allowed:
            setattr(shoot, key, value)
    db.commit()
    return ok(message="Shoot updated")


@router.patch("/shots/{shot_id}")
def patch_shot(
    shot_id: UUID,
    body: ShotPatch,
    ctx: TenantContext = Depends(require_permission("shoots.write")),
    db: Session = Depends(get_db),
):
    shot = db.query(Shot).filter(Shot.id == shot_id, Shot.organization_id == ctx.organization_id).first()
    org_or_404(shot, "SHOT_NOT_FOUND", "Shot not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(shot, field, value)
    db.commit()
    db.refresh(shot)
    return ok(
        {
            "id": str(shot.id),
            "status": shot.status,
            "description": shot.description,
        },
        "Shot updated",
    )
