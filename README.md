# Kurox

**Studio Operations. CRM. Production. Growth.**

Kurox is a multi-tenant SaaS operating system for production houses: CRM, production (projects, shoots, shot lists), tasks, assets, quotes/invoices, marketing, SEO, calendar, automation, and a client portal.

This repository is an **MVP starter**: real auth, tenancy, core domain APIs, and a branded web shell. Marketing/SEO live adapters, payment capture, and full mobile offline are **intentionally not faked**.

---

## Documentation (read in this order)

| # | Doc |
|---|-----|
| 0 | [Assumptions, risks, dependencies](docs/product/00-assumptions-and-risks.md) |
| 0b | [Parts A–X master index](docs/product/00-parts-index.md) |
| 1 | [Product requirements](docs/product/01-product-requirements.md) |
| 2 | [Personas](docs/product/02-user-personas.md) |
| 3 | [User flows & stories](docs/product/03-user-flows.md) |
| 4 | [Information architecture](docs/product/04-information-architecture.md) |
| 5 | [UX specification](docs/ux/05-ux-specification.md) |
| 6 | [Design system](docs/ux/06-ui-design-system.md) |
| 7 | [System architecture](docs/architecture/07-system-architecture.md) |
| 8 | [Database](docs/database/08-database-design.md) |
| 9 | [API](docs/api/09-api-specification.md) |
| 10 | [Security](docs/architecture/10-security.md) |
| 11 | [Integrations](docs/architecture/11-integrations.md) |
| 12 | [Testing](docs/architecture/12-testing-strategy.md) |
| 13 | [Deployment](docs/architecture/13-deployment.md) |
| 14 | [Roadmap](docs/product/14-roadmap.md) |
| 15 | [Success metrics](docs/product/15-success-metrics.md) |

Wireframes: [docs/ux/wireframes.md](docs/ux/wireframes.md)

---

## Implemented vs placeholder

### Implemented in this starter

- Signup / login / refresh / logout (JWT + refresh rotation)
- Organization + RBAC permission checks on the API
- Customers, contacts, leads (CRUD + convert)
- Projects, tasks, shoots, shots
- Quotes + convert-to-project, invoices + manual payments
- Notes, activity timeline
- Dashboard aggregation from real tables
- Web: auth screens, app shell, dashboard, CRM, projects, tasks, shoots, finance, calendar, settings, client portal
- Object-storage **port** + local filesystem adapter (dev)
- Email **port** + console adapter
- Seeded demo organization

### Placeholder / mock (clearly labeled in UI)

- Live Google Ads / Meta / GSC (NoOp adapters)
- Stripe/Razorpay capture (NoOp payment adapter)
- Weather live data
- Push notifications
- Google/Outlook calendar sync
- PDF generation (job stub)
- Automation visual builder (engine + 3 default rules; UI is Phase 5-complete)
- Mobile: navigation and screens exist; talks to same API; offline cache is Phase 4

---

## Stack

- **Web:** React, TypeScript, Vite, Tailwind, React Router, TanStack Query, RHF, Zod
- **API:** Python 3.12, FastAPI, SQLAlchemy 2, Alembic, PostgreSQL, Redis (optional in dev)
- **Mobile:** Expo + React Native + TypeScript
- **Monorepo:** pnpm workspaces (`apps/web`, `apps/mobile`, `packages/*`); API is Python

---

## Quick start

### Prerequisites

- Docker Desktop (Postgres, Redis, MinIO optional)
- Node 20+ and [pnpm](https://pnpm.io)
- Python 3.12+

### 1. Infrastructure

```bash
docker compose up -d postgres redis
```

### 2. Environment

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

### 3. API

```bash
cd apps/api
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -e ".[dev]"
alembic upgrade head
python -m app.seed
uvicorn app.main:app --reload --port 8000
```

OpenAPI: http://localhost:8000/api/v1/docs

### 4. Web

```bash
pnpm install
pnpm --filter @kurox/web dev
```

App: http://localhost:5173

### 5. Mobile (optional)

```bash
pnpm --filter @kurox/mobile start
```

---

## Demo accounts (after seed)

All passwords: `Kurox!studio1`

| Role | Email |
|------|--------|
| Admin / Owner | `dev@aperture.kurox.dev` |
| Production Manager | `arjun@aperture.kurox.dev` |
| Marketer | `meera@aperture.kurox.dev` |
| SEO | `kabir@aperture.kurox.dev` |
| Accountant | `nisha@aperture.kurox.dev` |
| Team Member | `ravi@aperture.kurox.dev` |
| Client | `priya@northstar.kurox.dev` |

Organization: **Aperture Films** (demo tenant).

---

## Repository layout

See [docs/architecture/07-system-architecture.md](docs/architecture/07-system-architecture.md) and the tree under `apps/`, `packages/`, `docs/`, `infrastructure/`.

---

## License

Proprietary — all rights reserved unless otherwise specified.
