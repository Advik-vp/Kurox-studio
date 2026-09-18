# 07 — System Architecture

## 1. Overview

```
                    ┌──────────────┐     ┌──────────────┐
                    │  Web (React) │     │ Mobile (Expo)│
                    └──────┬───────┘     └──────┬───────┘
                           │ HTTPS / JSON       │
                           ▼                    ▼
                    ┌─────────────────────────────────┐
                    │     FastAPI  /api/v1            │
                    │  Auth · RBAC · Tenant gate      │
                    │  Modular domain routers         │
                    └──────────────┬──────────────────┘
           ┌───────────────┬───────┴────────┬─────────────┐
           ▼               ▼                ▼             ▼
     PostgreSQL 16       Redis 7      Celery workers   Object storage
     (system of record)  (cache,       (email, PDF,    (S3/R2/MinIO)
                          broker,       metrics,        
                          rate limit)   automation)
                           │
                           ▼
                    Integration Service
                    (provider adapters)
```

---

## 2. Backend modules

```
auth  users  organizations  crm  contacts  projects
production  shoots  tasks  assets  calendar
quotes  invoices  payments  expenses
marketing  seo  analytics  notifications
automation  audit  settings  integrations
```

Each module owns: models (or clearly shared), schemas, service, router, permissions. Cross-module calls go through **services**, not sibling routers.

---

## 3. Request pipeline

1. CORS / HTTPS
2. Rate limit (Redis)
3. JWT parse
4. Load user + org + roles + permission set (cached)
5. Tenant context set (`organization_id`)
6. Route handler → service → repository
7. Audit decorator on mutating finance/acl operations
8. Envelope response

---

## 4. Multi-tenancy

- Every tenant table has `organization_id NOT NULL` (except `users` for super admin).
- Services accept `TenantContext`. Repositories **require** it; missing org raises.
- IDs are UUIDs; leaking a UUID from another org returns **404**.
- Super admin APIs are under `/api/v1/platform/*` and bypass tenant, with separate permission `platform.admin`.

---

## 5. Background jobs

Celery queues:

| Queue | Jobs |
|-------|------|
| `default` | notifications, automation |
| `mail` | transactional email |
| `media` | asset processing, thumbnails |
| `pdf` | quote/invoice PDF |
| `sync` | integration pulls (Phase 3) |

---

## 6. Caching

- Permission sets: Redis 5 min per user
- Dashboard aggregates: 30–60s per org+persona
- Never cache tenant data without org key

---

## 7. File architecture

Browser → `POST /assets/uploads` (intent) → API creates `assets` row `uploaded` → returns presigned PUT → client uploads to MinIO/S3 → `POST /assets/{id}/complete` → `processing` job → `internal_review`.

---

## 8. Web architecture

Vite SPA. React Router 6. TanStack Query for server state. Zustand for session UI (sidebar, theme, command palette). React Hook Form + Zod. API client in `apps/web/src/lib/api`.

---

## 9. Mobile architecture

Expo app, React Navigation. SecureStore for tokens. TanStack Query. Offline cache for today’s shoots/tasks (Phase 4 complete; scaffold in starter).

---

## 10. Environments

`development` | `staging` | `production`

Config via env only. `.env.example` documents every key.
