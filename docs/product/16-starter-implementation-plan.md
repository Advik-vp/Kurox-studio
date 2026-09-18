# Starter implementation plan (what was generated)

## Sequence followed

Product requirements → personas → flows → IA → wireframes → design system → system/DB/API/security → web + mobile architecture → scaffolding → tests → deployment docs.

## Repo bootstrap (day 1)

1. `docker compose up -d postgres redis`
2. `cd apps/api && pip install -e ".[dev]" && alembic upgrade head && python -m app.seed`
3. `uvicorn app.main:app --reload --port 8000`
4. `pnpm install && pnpm --filter @kurox/web dev`
5. Sign in as `arjun@aperture.kurox.dev` / `Kurox!studio1`

## Build order for the remaining MVP (Phase 2)

1. Harden tenant tests (two-org isolation)
2. Quote PDF job + send email
3. Invoice overdue Celery beat
4. Asset dropzone + local/S3 complete callback
5. Playwright E2E for lead → quote → project → shoot → invoice
6. Client approve/request-changes UI wired to `POST /assets/{id}/approve` (done in starter)
7. Command palette search (Ctrl+K wired to customers/projects)
8. RLS design spike on Postgres

## Explicitly unfinished (do not treat as production)

- Payment capture
- Live ads/SEO
- Push notifications
- Drag-and-drop calendar
- Custom dashboard widgets
- Super-admin platform console
- White-label
