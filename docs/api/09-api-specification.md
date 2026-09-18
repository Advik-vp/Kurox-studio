# 09 — API Specification

**Base:** `/api/v1`  
**Auth:** `Authorization: Bearer <access_token>` unless noted  
**OpenAPI:** generated at `/api/v1/docs` (Swagger) and `/api/v1/openapi.json`

## Envelope

Success:

```json
{
  "success": true,
  "data": {},
  "message": "Project created successfully",
  "meta": { "page": 1, "page_size": 25, "total": 0 }
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "PROJECT_NOT_FOUND",
    "message": "Project not found",
    "details": null
  }
}
```

List query params (all collections): `page`, `page_size`, `q`, `sort`, `order=asc|desc`, plus resource filters.

Error HTTP mapping: 400 validation `VALIDATION_ERROR`, 401 `UNAUTHENTICATED`, 403 `FORBIDDEN`, 404 `NOT_FOUND`, 409 conflict codes, 429 `RATE_LIMITED`, 500 `INTERNAL`.

---

## Auth (public)

| Method | Path | Body | Success |
|--------|------|------|---------|
| POST | `/auth/register` | `{ organization_name, first_name, last_name, email, password }` | user + org + tokens (unverified) |
| POST | `/auth/login` | `{ email, password }` | `{ user, tokens }` |
| POST | `/auth/refresh` | `{ refresh_token }` | new tokens (rotation) |
| POST | `/auth/logout` | `{ refresh_token }` | revoke |
| POST | `/auth/logout-all` | — | revoke family |
| POST | `/auth/forgot-password` | `{ email }` | always 200 |
| POST | `/auth/reset-password` | `{ token, password }` | |
| POST | `/auth/verify-email` | `{ token }` | |
| POST | `/auth/resend-verification` | — | |

Tokens: `{ access_token, refresh_token, token_type, expires_in }`.

---

## Users & org

| Method | Path | Authz |
|--------|------|-------|
| GET | `/me` | any |
| PATCH | `/me` | any |
| GET | `/me/preferences` | any |
| PATCH | `/me/preferences` | any |
| GET | `/organization` | org member |
| PATCH | `/organization` | `org.write` |
| GET | `/users` | `team.read` |
| POST | `/users/invites` | `team.invite` |
| POST | `/invites/{token}/accept` | public |
| PATCH | `/users/{id}` | `team.write` |
| POST | `/users/{id}/disable` | `team.write` |

---

## CRM

| Method | Path | Authz |
|--------|------|-------|
| GET/POST | `/leads` | `crm.read` / `crm.write` |
| GET/PATCH/DELETE | `/leads/{id}` | |
| POST | `/leads/{id}/convert` | `crm.write` |
| GET/POST | `/leads/{id}/activities` | |
| GET/POST | `/customers` | `crm.read/write` |
| GET/PATCH/DELETE | `/customers/{id}` | archive via DELETE soft |
| GET/POST | `/customers/{id}/contacts` | |
| GET | `/customers/{id}/timeline` | |
| GET/POST | `/contacts` | |

Customer create body:

```json
{
  "display_name": "Northstar Brands",
  "company_name": "Northstar Brands Pvt Ltd",
  "website": "https://northstar.example",
  "industry": "FMCG",
  "assigned_user_id": "uuid",
  "tags": ["retainer", "video"],
  "primary_contact": {
    "first_name": "Priya",
    "last_name": "Shah",
    "email": "priya@northstar.example",
    "phone": "+91...",
    "title": "Brand Lead"
  }
}
```

---

## Projects, tasks, production

| Method | Path | Authz |
|--------|------|-------|
| GET/POST | `/projects` | `projects.read/write` |
| GET/PATCH | `/projects/{id}` | + resource grant for clients |
| POST | `/projects/{id}/members` | `projects.write` |
| GET/POST | `/projects/{id}/tasks` | `tasks.write` |
| GET/POST | `/tasks` | |
| PATCH | `/tasks/{id}` | |
| GET/POST | `/shoots` | `shoots.read/write` |
| GET/PATCH | `/shoots/{id}` | |
| GET/POST | `/shoots/{id}/shots` | |
| PATCH | `/shots/{id}` | |
| GET/POST | `/shoots/{id}/crew` | |

---

## Notes & comments

`POST /notes` `{ entity_type, entity_id, body, is_client_visible }`  
`POST /comments` + mentions array parsed server-side from `@`.

---

## Finance

| Method | Path | Authz |
|--------|------|-------|
| GET/POST | `/quotes` | `quotes.read/write` |
| GET/PATCH | `/quotes/{id}` | |
| POST | `/quotes/{id}/send` | |
| POST | `/quotes/{id}/convert-to-project` | `projects.write` + `quotes.write` |
| GET | `/public/quotes/{token}` | public |
| POST | `/public/quotes/{token}/decision` | `{ decision: approved\|rejected, comment }` |
| GET/POST | `/invoices` | `invoices.write` |
| POST | `/invoices/{id}/send` | |
| POST | `/invoices/{id}/payments` | `payments.write` |
| GET/POST | `/expenses` | `expenses.write` |
| GET | `/catalog/items` | |

---

## Assets

| Method | Path |
|--------|------|
| POST | `/assets/uploads` `{ project_id, filename, mime, size }` → `{ asset, upload: { url, headers } }` |
| POST | `/assets/{id}/complete` |
| GET | `/assets` |
| GET | `/assets/{id}` |
| POST | `/assets/{id}/approve` |
| POST | `/assets/{id}/request-changes` |
| GET | `/assets/{id}/download` | presigned GET |

---

## Calendar, marketing, SEO, analytics

- `GET/POST /calendar/events`
- `GET/POST /marketing/campaigns`
- `GET/POST /marketing/campaigns/{id}/metrics`
- `GET/POST /seo/projects` … keywords, snapshots, content
- `GET /analytics/dashboard?from&to&customer_id&project_id`

Dashboard payload sections: `kpis`, `pipeline`, `shoots`, `tasks`, `revenue_series`, `marketing`, `seo`, `activity`. Missing integration data is `null` + `unavailable_reason`.

---

## Automation, notifications, audit

- `GET/POST /automation/rules`
- `PATCH /automation/rules/{id}`
- `GET /automation/rules/{id}/logs`
- `GET /notifications` `POST /notifications/{id}/read` `POST /notifications/read-all`
- `GET /audit-logs` (`audit.read`)

---

## Authorization matrix (summary)

| Role | CRM | Projects | Shoots | Finance | Mkt | SEO | Team | Client data |
|------|-----|----------|--------|---------|-----|-----|------|-------------|
| Super Admin | platform only | | | | | | | |
| Admin | full | full | full | full | full | full | full | all org |
| Production Manager | full | full | full | read assigned | read | read | read | org |
| Marketer | leads+cust | read | — | budgets read | full | read | — | org |
| SEO Specialist | read assigned | read | — | — | — | full | — | assigned |
| Accountant | read | read | — | full | — | — | — | org |
| Team Member | — | assigned | assigned | — | — | — | — | assigned |
| Client | — | granted | — | own quotes/invoices | — | — | — | own |

Frontend may hide buttons; API enforces.

---

## Idempotency

`Idempotency-Key` header on POST payments, quote convert, invoice send.
