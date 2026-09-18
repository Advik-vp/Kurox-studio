# 14 — Roadmap

## Phase 1 — Foundation (1–2 weeks)

Repository, design tokens, FastAPI app, Postgres models + Alembic, auth, organizations, users, roles, RBAC middleware, web shell (sidebar, header, login/signup), CI skeleton, Docker Compose.

**Exit:** a user can sign up an org, invite a teammate, log in, see an empty persona dashboard.

## Phase 2 — MVP Core (3–5 weeks)

CRM, projects, tasks, shoots, shot lists, notes, calendar, quotes, invoices, payments (manual), expenses, basic assets (presign), dashboard KPIs from real data, permissions, client portal (quotes + asset approve).

**Exit:** lead → customer → quote → project → shoot → invoice can be demonstrated on seed data.

## Phase 3 — Marketing & SEO (2–4 weeks)

Campaign CRUD, metrics import, Google Ads + Meta adapters, SEO projects/keywords, GSC adapter, reports.

## Phase 4 — Mobile (3–4 weeks)

Expo app: auth, dashboard, CRM contacts, projects, tasks, shoots, calendar, notifications, asset upload (camera), client approvals, offline cache.

## Phase 5 — Automation (2–3 weeks)

Visual rule builder, additional triggers/actions, notification fan-out, finance reminders, logs, safety (loop cap).

## After MVP (designed, not built)

AI assistant, proposal/quote suggestions, delay prediction, equipment inventory, crew marketplace, WhatsApp, voice, realtime collab, BI, white-label, multi-location, Tally/QuickBooks, client subscriptions.

Extension points: `apps/api/app/integrations/ports.py`, `automation` action registry, `analytics` snapshot jobs.
