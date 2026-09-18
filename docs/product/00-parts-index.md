# KUROX — Master architecture (Parts A–X)

**Studio Operations. CRM. Production. Growth.**

This is the map the original product prompt asked for. Deep specifications live in numbered docs `01`–`16`. Read [00-assumptions-and-risks.md](./00-assumptions-and-risks.md) first.

| Part | Title | Canonical doc |
|------|-------|----------------|
| A | Executive product overview | [01-product-requirements.md](./01-product-requirements.md) |
| B | User personas | [02-user-personas.md](./02-user-personas.md) |
| C | Functional requirements | [01-product-requirements.md](./01-product-requirements.md) §6 |
| D | MVP feature breakdown | [14-roadmap.md](./14-roadmap.md) + 01 |
| E | User journeys | [03-user-flows.md](./03-user-flows.md) |
| F | Information architecture | [04-information-architecture.md](./04-information-architecture.md) |
| G | UX/UI specification | [../ux/05-ux-specification.md](../ux/05-ux-specification.md) |
| H | Design system | [../ux/06-ui-design-system.md](../ux/06-ui-design-system.md) |
| I | System architecture | [../architecture/07-system-architecture.md](../architecture/07-system-architecture.md) |
| J | Database architecture | [../database/08-database-design.md](../database/08-database-design.md) |
| K | API specification | [../api/09-api-specification.md](../api/09-api-specification.md) |
| L | Integration architecture | [../architecture/11-integrations.md](../architecture/11-integrations.md) |
| M | Security architecture | [../architecture/10-security.md](../architecture/10-security.md) |
| N | Web architecture | [../architecture/16-web-mobile-automation-analytics.md](../architecture/16-web-mobile-automation-analytics.md) |
| O | Mobile architecture | same |
| P | Automation architecture | same |
| Q | Analytics architecture | same |
| R | Testing strategy | [../architecture/12-testing-strategy.md](../architecture/12-testing-strategy.md) |
| S | Deployment architecture | [../architecture/13-deployment.md](../architecture/13-deployment.md) |
| T | MVP roadmap | [14-roadmap.md](./14-roadmap.md) |
| U | Future expansion | 14 §After MVP |
| V | Success metrics | [15-success-metrics.md](./15-success-metrics.md) |
| W | Starter repository structure | this file §W + root README |
| X | Starter implementation plan | [16-starter-implementation-plan.md](./16-starter-implementation-plan.md) |

Wireframes: [../ux/wireframes.md](../ux/wireframes.md)

---

## PART A — Executive product overview

Kurox is a **multi-tenant SaaS operating system for production houses, creative studios, and advertising operations**. It is not a generic CRM. Every module exists to move work through:

**Lead → Customer → Quote → Project → Pre-Production → Shoot → Assets → Editing → Marketing → SEO/Ads → Delivery → Invoice → Payment → Analytics**

Studios today split that lifecycle across WhatsApp, Drive, Sheets, Trello, Ads Manager, Search Console, and Tally. Profitability is reconstructed after the fact. Kurox is the system of record: one customer, one project, one budget, one crew, one invoice.

Surfaces: **responsive web** (command center) and **Expo mobile** (operational: shoots, tasks, CRM, approvals).

Brand: **KUROX** — *Studio Operations. CRM. Production. Growth.* Visual language: dark control-room, tungsten gold accent, production vocabulary (call time, shot list, client review) — not a bank ledger.

---

## PART B — User personas

| Persona | Job | Default home |
|---------|-----|----------------|
| Production Manager (Arjun) | Today’s shoots, crew, shots, blockers | Production dashboard |
| Marketer (Meera) | Campaigns, spend, leads, ROI | Marketing |
| SEO Specialist (Kabir) | Keywords, content, site health | SEO |
| Accountant (Nisha) | Quotes, invoices, cash, project P&L | Finance |
| Admin / Owner | Org KPIs, users, settings, audit | Analytics + Team |
| Team Member (crew/editor) | Assigned tasks, shoots, assets | Tasks / Schedule |
| Client (Priya) | Status, approve quotes/assets, invoices | `/client` portal |
| Super Admin | Platform orgs (P1) | `/platform` (not in starter UI) |

Permissions are **RBAC + resource grants**. Frontend nav hiding is UX only.

---

## PART C — Functional requirements

Normative IDs: `FR-AUTH`, `FR-CRM`, `FR-PRJ`, `FR-SHOOT`, `FR-TASK`, `FR-NOTE`, `FR-FIN`, `FR-AST`, `FR-CAL`, `FR-MKT`, `FR-SEO`, `FR-ANL`, `FR-RBAC`, `FR-NOTIF` in product requirements.

Non-functional: CRUD p95 < 500ms, pagination, WCAG 2.2 AA target, tenant isolation, secrets in env, audit on finance/ACL.

---

## PART D — MVP feature breakdown

**Phase 1 (this starter):** repo, design tokens, FastAPI, Postgres models, JWT auth, org, RBAC, web shell, CRM/projects/shoots/tasks/quotes/invoices/dashboard, ports.

**Phase 2:** PDF, overdue jobs, asset dropzone, Playwright E2E, client approve UI, command palette search, RLS spike.

**Phase 3:** Ads + GSC adapters.

**Phase 4:** Mobile operational completeness (camera, push, offline).

**Phase 5:** Visual automation builder.

---

## PART E — User journeys

Eight normative workflows (new customer, project, shoot, quote, invoice, marketing, SEO, client approval) plus login/invite/follow-up — see user-flows, including acceptance criteria, APIs, and entities per story.

---

## PART F — Information architecture

Desktop sidebar matches studio departments (CRM, Production, Marketing, SEO, Finance, Calendar, Analytics, Automation, Team, Settings). Mobile: Home · Schedule · Tasks · CRM · More + FAB. Client portal is a separate IA with no internal modules.

Object tree: Organization → Users / Customers → Projects → Shoots → Shots; Projects also own Tasks, Assets, Quotes, Invoices.

---

## PART G — UX/UI specification

Control-room density on desktop; glanceable mobile. Lifecycle status always named. Honest empty states. Color is never the only status (badge text). Screen-by-screen layout, data, actions, empty/loading/error, responsive rules: UX spec + wireframes (25 screens).

---

## PART H — Design system

Tokens `kx-*`: bg `#0B0C0E`, accent tungsten `#D4A017`, shoot `#FF7A45`. Fonts: Syne (brand), DM Sans (UI), IBM Plex Mono (IDs). Radius 8/12/16. Dark default, light first-class. Components in `apps/web/src/components/ui.tsx` (Button, Card, Badge, EmptyState, PageHeader, banners, Skeleton). shadcn primitives can be layered later without changing tokens.

---

## PART I — System architecture

```
Web (Vite React)  +  Mobile (Expo)
        │ HTTPS JSON /api/v1
        ▼
FastAPI (auth, RBAC, tenant gate, domain routers)
        │
   PostgreSQL 16   Redis   Celery workers   Object storage (S3/R2/MinIO)
        │
Integration Service → Provider adapters
```

Python modules: auth, users, organizations, crm, projects, production, tasks, assets, calendar, quotes, invoices, payments, marketing, seo, analytics, notifications, automation, audit, settings.

---

## PART J — Database architecture

PostgreSQL 16, UUID PKs, `organization_id` on tenant tables, `created_at`/`updated_at`, soft `deleted_at` on business entities. Money = integer minor units + ISO currency.

ERD and indexes: database design doc. Multi-tenant strategy: application-enforced org filter now; RLS later. Audit: `audit_logs` + `activities` timeline.

---

## PART K — API specification

REST `/api/v1`, envelope `{ success, data, message, meta }`, errors `{ success:false, error:{ code, message, details } }`. OpenAPI at `/api/v1/docs`. Pagination, filter, sort, search. Auth Bearer JWT. Full route table in API spec.

---

## PART L — Integration architecture

Domain → Port → Adapter → External API. Ports: Email, Storage, Payment, CalendarSync, AdsMetrics, SearchConsole, Weather, SMS. Credentials encrypted in `integrations`. Webhooks `POST /api/v1/webhooks/{provider}`.

Starter adapters: Console email, local filesystem storage, NoOp payment, NoOp ads.

---

## PART M — Security architecture

HTTPS, bcrypt passwords (Argon2id later), JWT access 15m + rotating refresh, reuse detection (family revoke), RBAC + resource grants, Pydantic validation, parameterized SQL, rate limits (designed), CORS allowlist, upload allowlist, audit, env secrets, 404 on cross-tenant. Frontend is never authoritative.

---

## PART N — Web architecture

`apps/web`: React 18, TS, Vite, React Router, TanStack Query, RHF-ready, Zod in `@kurox/validation`, Zustand only if needed (not required for session — AuthProvider). API client with single 401 refresh retry. Route guards: anon → login; client → `/client`.

---

## PART O — Mobile architecture

`apps/mobile`: Expo + React Native + TS. Tabs: Home, Schedule, Tasks, CRM, More. Auth via SecureStore. Same API. Phase 4: camera → presign, push, offline queue. Android emulator host `10.0.2.2`.

---

## PART P — Automation architecture

Trigger → conditions → actions → `automation_logs`. Registry in `app/services/domain.py`. Seeded:

1. Project → Production → production checklist tasks  
2. Invoice overdue → finance follow-up (beat job Phase 2)  
3. Project → Delivered → invoice reminder task  

Visual WHEN/IF/THEN builder is Phase 5.

---

## PART Q — Analytics architecture

Raw tables → SQL aggregates → `GET /analytics/dashboard` → widgets. No warehouse in MVP. Marketing/SEO return `connected: false`. Future: nightly `analytics_daily` snapshots. Date range Phase 2.

---

## PART R — Testing strategy

Unit (money, auth hash, automations). Integration (tenant isolation, convert lead/quote, client notes). E2E Playwright (lifecycle). Mobile later Detox/Maestro. Starter tests in `apps/api/tests/`.

---

## PART S — Deployment architecture

Local: Docker Compose (Postgres, Redis, MinIO, Mailhog) + uvicorn + Vite. Prod sketch: static web CDN, API+worker containers, RDS, Redis, S3/R2, migrate on release. Health `/health`, ready `/ready`.

---

## PART T — MVP roadmap

1–2w foundation → 3–5w core studio loop → 2–4w marketing/SEO → 3–4w mobile → 2–3w automation. See roadmap doc.

---

## PART U — Future expansion

AI production assistant, meeting summaries, proposal/quote suggestions, campaign/SEO AI, delay/revenue prediction, equipment inventory, crew marketplace, subscriptions, Tally/QuickBooks, WhatsApp, voice, realtime collab, BI, white-label, multi-location. Extension points: ports, automation registry, analytics snapshots.

---

## PART V — Success metrics

WAU/MAU, projects/customers created, task completion, lead→project time, quote→approval time, overdue rate, invoice collection time, campaign ROAS (when connected), keyword movement, client approval time, error rate. Full table in success-metrics.

---

## PART W — Starter repository structure

```
kurox/   (this workspace root)
├── apps/
│   ├── api/          FastAPI, Alembic, seed, tests
│   ├── web/          Vite React SPA
│   └── mobile/       Expo app
├── packages/
│   ├── types/        shared TS unions
│   ├── validation/   Zod schemas
│   ├── ui/           reserved for extracted primitives
│   └── config/
├── docs/             product, ux, architecture, api, database
├── infrastructure/   future Terraform/Compose overlays
├── tests/            future e2e
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## PART X — Starter implementation plan

Sequence executed: requirements → personas → flows → IA → wireframes → design system → system/DB/API/security → web/mobile → scaffolding → tests → deploy docs.

**Run order:** compose Postgres → seed → API :8000 → web :5173 → login `arjun@aperture.kurox.dev` / `Kurox!studio1`.

Remaining Phase 2 list: tenant tests, PDF job, overdue beat, asset dropzone, Playwright, client approve wiring, command palette, RLS.
