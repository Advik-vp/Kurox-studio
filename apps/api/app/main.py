from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from app.api.auth import router as auth_router
from app.api.crm import router as crm_router
from app.api.finance import router as finance_router
from app.api.production import router as production_router
from app.api.workspace import router as workspace_router
from app.core.config import get_settings
from app.core.errors import AppError

settings = get_settings()

app = FastAPI(
    title="Kurox API",
    version="0.1.0",
    description="Studio operations OS — CRM, production, finance, growth.",
    docs_url="/api/v1/docs",
    openapi_url="/api/v1/openapi.json",
    redoc_url="/api/v1/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.web_origin, "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(AppError)
async def app_error_handler(_: Request, exc: AppError):
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "error": {"code": exc.code, "message": exc.message, "details": exc.details}},
    )


@app.exception_handler(ValidationError)
async def validation_handler(_: Request, exc: ValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "error": {"code": "VALIDATION_ERROR", "message": "Invalid request", "details": exc.errors()},
        },
    )


@app.get("/health")
def health():
    return {"status": "ok", "product": "kurox"}


@app.get("/ready")
def ready():
    from sqlalchemy import text

    from app.db.session import engine

    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    return {"status": "ready"}


prefix = "/api/v1"
app.include_router(auth_router, prefix=prefix)
app.include_router(crm_router, prefix=prefix)
app.include_router(production_router, prefix=prefix)
app.include_router(finance_router, prefix=prefix)
app.include_router(workspace_router, prefix=prefix)


# Public quote routes live on finance router under /public — already included.
