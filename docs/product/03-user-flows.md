# 03 — User Flows

Each flow is written as a UX + system sequence. API names match [09-api-specification.md](../api/09-api-specification.md).

---

## Workflow 1 — New customer (from lead)

**Actor:** Production Manager or Marketer  
**Entry:** Sidebar → CRM → Leads → New Lead

### Main flow

1. User opens Lead form (drawer on desktop, full screen on mobile).
2. Enters company/person name, email, phone, source (`referral`, `instagram`, `website`, `inbound_call`, `other`), service interest (project type), owner.
3. System creates lead `status=new`, activity `lead.created`.
4. User logs a call/note; status → `contacted`. Follow-up reminder optional → calendar + notification.
5. Qualification: budget range, timeline, decision maker → `qualified`.
6. User creates quote (Workflow 4) or marks `proposal` / `negotiation`.
7. On `won`: Convert dialog. Creates Customer + primary Contact, links `lead.converted_customer_id`. Optional: create project immediately.

### Alternatives

- Duplicate email warning if another lead/customer exists in org.
- `lost` requires lost reason (required enum + note).
- Client-submitted website form (future) lands as `new` with source `website`.

### Acceptance (story)

See user stories in this file, CRM-01.

---

## Workflow 2 — New project

**Actor:** Production Manager / Admin  
**Entry:** Customer profile → Create Project, or Projects → New, or Quote → Convert

### Main flow

1. Select customer (locked if launched from customer/quote).
2. Name, type, description, start/end, budget (prefilled from quote total if converted), PM, team, priority, tags.
3. Status starts `planning`.
4. System creates default task pack by project type (photography vs commercial vs SEO retainer).
5. User optionally “Schedule shoot” CTA → Workflow 3.
6. Activity `project.created` on customer + project timelines.

### Alternatives

- Converted from quote: quote locked, line items copied to `project_budget_items`.
- Missing PM: allowed, dashboard shows “Unassigned PM” alert.

---

## Workflow 3 — Shoot

**Actor:** Production Manager  
**Entry:** Project → Production → Create Shoot

### Main flow

1. Date, call time, wrap estimate, location (name, address, geo optional), client contact on set, PM, crew (users + external names), equipment checklist, production notes.
2. Status `planning` → `scheduled` when date + location present.
3. Shot list: add shots (inline or CSV later). Each shot starts `planned`.
4. Day-before: notification to crew (if scheduled).
5. Day-of: status `ready` → `in_progress`. Crew updates shot statuses from mobile.
6. Complete shoot: status `completed`; remaining `planned` shots flagged.

### Alternatives

- `cancelled` requires reason; calendar event cancelled.
- Weather JSON remains empty until provider configured.

---

## Workflow 4 — Quote

**Actor:** Accountant or Admin or PM (if permitted)  
**Entry:** Customer → Quotes → New

### Main flow

1. Add catalog services/products or custom lines (name, qty, unit price, tax rate).
2. Discount (amount or percent), terms, validity, notes (internal vs client).
3. Preview PDF (job). Status `draft`.
4. Send: email adapter + status `sent`. Client tokenized link.
5. Client opens → `viewed`. Approves → `approved` (or rejects with comment).
6. Convert to project (Workflow 2).

### Alternatives

- Expired job marks `expired` if still sent/viewed.
- Rejection returns to PM with task “Revise quote”.

---

## Workflow 5 — Invoice

**Actor:** Accountant  
**Entry:** Project → Invoice, or Finance → Invoices → New

### Main flow

1. Select customer + project. Import remaining unbilled quote/project lines or custom.
2. Tax, discount, due date, notes.
3. Generate number on first **send** (not on draft save).
4. Send → `sent`. Record payment(s) → `partially_paid` / `paid`.
5. Nightly job: `sent` + past due → `overdue` + automation.

### Alternatives

- Credit note (P1, placeholder in MVP UI).
- Cancelled only if no successful payments.

---

## Workflow 6 — Marketing campaign

**Actor:** Marketer  
**Entry:** Project or Marketing → Campaigns → New

### Main flow

1. Platform (`meta`, `google_ads`, `linkedin`, `other`), budget, dates, client, project.
2. Status `draft` → `live`.
3. Metrics: manual entry or adapter import. Dashboard charts use stored `marketing_metrics` rows.
4. Empty state if no adapter: “Connect Google Ads in Settings → Integrations (Phase 3)”.

---

## Workflow 7 — SEO

**Actor:** SEO Specialist  
**Entry:** Customer → SEO Project → New

### Main flow

1. Website URL, competitors (optional), primary keywords.
2. Keyword list with target URL, current position (manual/stub).
3. Tasks (technical, content). Content items linked to keywords.
4. Metrics snapshots (manual or GSC adapter later).
5. Report: date range PDF/job (placeholder in MVP).

---

## Workflow 8 — Client approval

**Actor:** Client  
**Entry:** Email/push → Client portal → Project → Deliverables

### Main flow

1. Client sees assets in `client_review`.
2. Approve → asset `approved`, notify PM + editors.
3. Request changes → comment required, asset stays `client_review` with flag `changes_requested`, task created for assignee.
4. When all deliverable assets approved and project in `review`, PM can set `approved` then `delivered`.

### Alternatives

- Client cannot approve internal_review assets (hidden).
- Org setting: require all shots approved before delivery (optional).

---

## Additional core flows

### Login / signup

Signup: org name, full name, email, password → create org + admin user → verification email → login.  
Login: email/password → access + refresh. Unverified: limited banner, cannot invite.

### Invite teammate

Admin enters email + role → invite token 72h → user sets password → joins same org.

### Follow-up reminder

On lead/customer: date/time + note → `calendar_events` type `follow_up` + notification.

---

## User stories with acceptance criteria

### CRM-01 Create customer

**Description:** As a production manager, I want to create a customer so that I can associate projects with that customer.

**Preconditions:** Authenticated; role with `crm.customers.write`; org active.

**Main flow:** CRM → Customers → New → fill company + primary contact → save.

**Alternative:** Convert from won lead.

**Acceptance:**

- Customer appears in org-scoped list only.
- Primary contact created.
- Activity `customer.created`.
- Validation errors on missing name.
- 403 for client role.

**API:** `POST /api/v1/customers`  
**Entities:** `customers`, `contacts`, `activities`

---

### PRJ-01 Project from approved quotation

**Description:** As a production manager, I want to create a project from an approved quotation so that production can begin without duplicate data entry.

**Preconditions:** Quote `approved`; user `projects.write`.

**Main flow:** Quote detail → Convert to project → confirm name/dates/PM → project created.

**Alternative:** Quote not approved → 409 `QUOTE_NOT_CONVERTIBLE`.

**Acceptance:**

- Customer, budget, line items copied.
- Quote `converted_project_id` set; further line edits blocked.
- Idempotent: second convert returns existing project.

**API:** `POST /api/v1/quotes/{id}/convert-to-project`  
**Entities:** `quotes`, `quote_items`, `projects`, `project_budget_items`

---

### SHOOT-01 Create shoot schedule

**Description:** As a production manager, I want to create a shoot schedule so that the crew knows where and when the shoot happens.

**Preconditions:** Project exists; `shoots.write`.

**Main flow:** Project → Create shoot → date, call time, location, crew → save → calendar event created.

**Alternative:** Conflict: same crew already booked — warning, not hard block in MVP.

**Acceptance:**

- Shoot listed on project, calendar, “today’s shoots”.
- Crew members notified.
- Mobile shows shoot on that date.

**API:** `POST /api/v1/shoots`  
**Entities:** `shoots`, `shoot_crew`, `calendar_events`, `notifications`

---

### FIN-01 Invoice from project

**Description:** As an accountant, I want to create an invoice from a project so that I can bill the customer.

**Preconditions:** `invoices.write`; project has customer.

**Main flow:** Project → Invoice → add/import lines → tax → save draft → send.

**Alternative:** Project cancelled → still billable (allowed).

**Acceptance:**

- Invoice number assigned on send.
- Linked to customer + project.
- Appears on finance dashboard outstanding when sent.
- Client can view if sent.

**API:** `POST /api/v1/invoices` , `POST /api/v1/invoices/{id}/send`  
**Entities:** `invoices`, `invoice_items`, `activities`

---

### MKT-01 Connect advertising account

**Description:** As a marketer, I want to connect an advertising account so that I can monitor campaign performance from Kurox.

**Preconditions:** `integrations.write` (admin) or marketer + admin approval.

**Main flow (Phase 3):** Settings → Integrations → Google Ads → OAuth → store encrypted refresh token → adapter sync job.

**MVP:** Settings shows “Coming in Phase 3”; campaigns accept manual metrics. Story is specified so UI does not fake a connection.

**API (designed):** `POST /api/v1/integrations/google-ads/connect`  
**Entities:** `integrations`, `marketing_campaigns`, `marketing_metrics`

---

### SEO-01 Track keyword rankings

**Description:** As an SEO specialist, I want to track keyword rankings so that I can measure SEO progress.

**Preconditions:** SEO project exists; `seo.write`.

**Main flow:** Add keywords → enter/snapshot position → chart over time.

**Alternative:** Adapter sync (Phase 3).

**Acceptance:**

- Keyword unique per `(seo_project_id, keyword, locale)`.
- Metrics history retained.
- Dashboard shows delta vs previous snapshot.

**API:** `POST /api/v1/seo/projects/{id}/keywords` , `POST /api/v1/seo/keywords/{id}/snapshots`  
**Entities:** `seo_projects`, `seo_keywords`, `seo_metrics`

---

### CLT-01 Approve deliverable

**Description:** As a client, I want to approve a deliverable so that the production team knows it is ready for final delivery.

**Preconditions:** Client user; asset in `client_review`; grant on project.

**Main flow:** Open asset → Approve → optional comment.

**Alternative:** Request changes (comment required).

**Acceptance:**

- Status `approved`.
- Internal users notified.
- Client cannot approve another org’s asset (404, not 403, to avoid enumeration).

**API:** `POST /api/v1/assets/{id}/approve`  
**Entities:** `assets`, `asset_comments`, `notifications`, `activities`
