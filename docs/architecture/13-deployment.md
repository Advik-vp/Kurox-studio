# 13 — Deployment

## Local (developer)

```bash
docker compose up -d postgres redis minio mailhog
# API
cd apps/api && python -m venv .venv && pip install -e ".[dev]"
alembic upgrade head && python -m app.seed
uvicorn app.main:app --reload --port 8000
# Web
pnpm install && pnpm --filter @kurox/web dev
```

## Compose services

- `postgres:16`
- `redis:7`
- `minio` + bucket `kurox`
- `mailhog`
- `api` (optional in compose)
- `worker` celery

## CI (GitHub Actions outline)

- `api-lint-test`: ruff, pytest  
- `web-lint-test`: tsc, vitest, build  
- `mobile-typecheck`: tsc  

## Production sketch

- Web: static CDN (Cloudflare Pages / S3+CloudFront)
- API + worker: containers on Fly/Render/ECS/Cloud Run
- RDS Postgres, ElastiCache/Redis, S3/R2
- Migrate on release (`alembic upgrade head`)
- Health: `GET /health` liveness, `GET /ready` DB+Redis

## Environments

| Var class | Examples |
|-----------|----------|
| App | `ENVIRONMENT`, `API_BASE_URL`, `WEB_ORIGIN` |
| Auth | `JWT_SECRET`, `JWT_REFRESH_SECRET`, `ACCESS_TTL_MIN`, `REFRESH_TTL_DAYS` |
| DB | `DATABASE_URL` |
| Redis | `REDIS_URL` |
| Storage | `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY` |
| Email | `EMAIL_BACKEND`, `SMTP_*` |
| Crypto | `KMS_KEY` |

No secrets in git.
