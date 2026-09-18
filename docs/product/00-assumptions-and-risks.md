# 00 — Assumptions, ambiguities, technical risks, dependencies

This document is the **decision log** for Kurox MVP. Unspecified requirements were resolved here rather than blocking implementation. Change these in writing before changing code.

---

## 1. Product assumptions

| ID | Assumption | Implication |
|----|------------|-------------|
| A-01 | Primary market is **India-based production houses** selling globally | Default timezone `Asia/Kolkata`, currency **INR**, tax as **GST basis points** (18% = 1800 bps). Org can change currency. |
| A-02 | One user belongs to **one organization** in MVP | No multi-org switcher. Super Admin is platform-level (`organization_id` null). |
| A-03 | **English only** in MVP | Copy and UI strings are EN. i18n keys are not introduced yet; keep strings extractable. |
| A-04 | Clients are **invited users** with role `client`, not a separate product | Same web app, `/client` routes, resource grants. |
| A-05 | “Company” in CRM is the **Customer** record; Contacts hang off Customer | No free-floating companies table. Leads may convert into Customer + primary Contact. |
| A-06 | Opportunities = **Leads in pipeline** for MVP | No separate `opportunities` table until Phase 2+ if sales process diverges. |
| A-07 | Quotes can convert when status is `sent`, `viewed`, or `approved` | Studios often convert after verbal yes before the client clicks Approve. |
| A-08 | Invoice numbers are assigned **on create** in starter; spec prefers **on send** | Follow-up: move numbering to send in Phase 2. Prefix `{ORG_PREFIX}-{YYYY}-{seq}`. |
| A-09 | Money is **integer minor units** (paise/cents) | Never store floats for currency. |
| A-10 | Marketing/SEO live APIs are **Phase 3** | UI must show disconnected adapters, never fake ROAS/rankings. Manual campaign/SEO rows are real. |
| A-11 | Payment capture is **Phase 2+** | Manual `payments` rows are implemented. Stripe/Razorpay are ports only. |
| A-12 | Weather, Google/Outlook calendar, WhatsApp, Gmail are **adapters, not MVP features** | Schema fields exist (`weather` JSON on shoots). |
| A-13 | Super Admin platform console is **P1** | Seed has no platform user. APIs under `/platform/*` are designed, not built. |
| A-14 | Drag-and-drop calendar and custom dashboard widgets are **P1** | Calendar is list/agenda in starter. |
| A-15 | Mentions (`@user`) are **P1** | Notes store plain text; parse later. |
| A-16 | Project types include studio-native values | `commercial`, `brand_film`, `photography`, `event`, `seo_retainer`, `social`, `other`. |
| A-17 | Equipment inventory is a **checklist on the shoot**, not a warehouse | Full inventory is post-MVP. |
| A-18 | Email verification is **auto-completed in development seed/register** | Production must send verify tokens. Flag in auth register is labeled. |
| A-19 | Access tokens in **localStorage** for SPA starter | Move to httpOnly cookies before public internet launch (XSS). |
| A-20 | Demo tenant **Aperture Films** is the narrative studio for screenshots and QA | Not for production data. |

---

## 2. Ambiguities resolved

| Topic | Decision |
|-------|----------|
| Super Admin vs Admin | Super Admin = Kurox operator (all orgs). Admin = org owner. |
| Team Member vs crew | Team Member is an org user. External crew on a shoot can be a name string without a login. |
| Client seeing finance | Clients may view **their** sent quotes and invoices, not expenses or crew rates. |
| PM seeing finance | Production Manager has **read** on quotes/invoices, not write/payments. |
| Duplicate emails | User email is **globally unique**. Contact emails are unique per org (soft). |
| Soft vs hard delete | Customers, projects, shoots, leads, quotes, invoices, assets: **soft delete**. Auth tokens: hard revoke. |
| Quote public link | Unguessable `public_token`; no login required to view/approve. |
| Cross-tenant ID leak | Always **404**, never 403, to reduce enumeration. |
| Task dependencies | Column reserved; UI in Phase 2. |
| Catalog of services | Seed may include items later; quote lines are free-text in starter. |

---

## 3. Technical risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Tenant leak in a new query | High if rushed | Every repository requires `organization_id`. Tests with two orgs. Later Postgres RLS. |
| Large media in DB | High | Object storage port; DB stores metadata + key only. |
| JWT in localStorage XSS | Medium | Short access TTL, CSP, cookie migration before launch. |
| Refresh token theft / reuse | Medium | Rotation + family revoke. |
| Celery/Redis unavailable in small studios | Medium | Sync fallback for email in `ENVIRONMENT=development`. |
| Ads API quota / breaking changes | Medium | Adapter isolation; store snapshots in `marketing_metrics`. |
| GST/tax complexity (Cess, reverse charge) | Medium | Single tax rate per line in MVP; org settings JSON for extras. |
| OneDrive/Windows path + Docker | Medium (this workspace) | Compose uses named volumes; API uses `localhost` Postgres. |
| SQLAlchemy 2 `.get()` deprecation | Low | Migrate remaining `.get()` to `db.get()`. |
| bcrypt vs Argon2 | Low | bcrypt now; Argon2id documented for prod hardening. |

---

## 4. Dependencies

**Must have to run locally**

- Docker Desktop (Postgres 16, Redis 7)
- Python 3.12+
- Node 20+ and pnpm 9
- Ports 5432, 6379, 8000, 5173 free

**Phase 3+ credentials (not required for starter)**

- Google Cloud OAuth (Ads, GSC, Calendar)
- Meta Marketing API
- Stripe and/or Razorpay
- S3/R2 bucket
- SMTP or transactional email (Postmark/SES)

**Human dependencies**

- A studio champion (Admin) to invite roles
- Sample rate card for quote lines
- Brand assets for org logo (optional)

---

## 5. MVP scope control

**In starter (implemented or clearly scaffolded)**

Auth, org, RBAC, CRM (leads/customers/contacts), projects, tasks, shoots, shots, notes, calendar events, quotes, invoices, manual payments, expenses, assets metadata + storage port, dashboard aggregates, automation hooks (production checklist), marketing/SEO records + NoOp adapters, client portal shell, Expo operational shell.

**Explicitly out**

AI, white-label, live ads/SEO sync, live payment capture, push notifications, WhatsApp, realtime collab, equipment marketplace, advanced BI warehouse, multi-location orgs.

---

## 6. Definition of “honest UI”

If a feature is not wired:

1. Show a **dashed gold banner** (`PlaceholderBanner`) explaining phase and adapter.
2. Do **not** invent charts with zeros that look like “no performance”.
3. Keep the **data model** so the team can fill it without a rewrite.
