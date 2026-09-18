# 01 — Product Requirements

**Product:** Kurox  
**Tagline:** Studio Operations. CRM. Production. Growth.  
**Type:** Multi-tenant SaaS for production houses, creative studios, and advertising operations  
**Document status:** MVP contract  
**Related:** [00-assumptions-and-risks.md](./00-assumptions-and-risks.md)

---

## 1. Executive summary

Kurox is the operating system for a studio. It is not a generic CRM with a “projects” tab. Every module exists to move work through one lifecycle:

**Lead → Customer → Quote → Project → Pre-Production → Shoot → Assets → Editing → Marketing → SEO/Ads → Delivery → Invoice → Payment → Analytics**

Management must see that entire lifecycle from one command center. Crew must run today’s shoot from mobile. Finance must bill from the same project the production team just delivered. Clients must approve work without emailing WhatsApp links.

---

## 2. Problem

Studios run on disconnected tools: WhatsApp for clients, spreadsheets for shot lists, Drive for footage, a generic CRM for leads, Trello for tasks, Excel for quotes, Tally for invoices, Ads Manager for campaigns, Search Console for SEO. Nothing shares a customer or a budget. Profitability is reconstructed after the fact.

Kurox replaces that patchwork with a **studio-native system of record**.

---

## 3. Goals (MVP)

1. One organization workspace for a production house.
2. Role-based access for production, marketing, SEO, finance, leadership, crew, and clients.
3. CRM that understands studio leads (campaigns, retainers, shoots) not just “deals”.
4. Projects that own shoots, shot lists, tasks, assets, quotes, and invoices.
5. Finance that can quote, convert, invoice, and track payment status.
6. A command-center dashboard that is persona-aware.
7. An architecture that can later attach Ads, Search Console, calendars, and payment providers without rewriting core modules.

---

## 4. Non-goals (MVP)

Live ad-network sync, live GSC, payment capture, AI, white-label, multi-org users, advanced inventory, WhatsApp bots, real-time co-editing.

---

## 5. Primary workflow (normative)

```
Lead captured
  → qualified
  → quotation issued
  → quotation approved
  → project created (from quote)
  → production manager assigned
  → pre-production tasks + shoot scheduled
  → shoot executed (shot list)
  → assets uploaded / reviewed
  → post-production tasks
  → client review / approval
  → optional marketing campaign + SEO project
  → delivery
  → invoice
  → payment
  → analytics (profitability, utilization, campaign, SEO)
```

---

## 6. Functional requirements (by module)

### FR-AUTH — Authentication & organization

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-AUTH-01 | Email + password register/login | P0 |
| FR-AUTH-02 | Email verification | P0 |
| FR-AUTH-03 | Forgot / reset password (time-limited token) | P0 |
| FR-AUTH-04 | Invite user by email + role | P0 |
| FR-AUTH-05 | Organization workspace on signup (creates org + admin) | P0 |
| FR-AUTH-06 | JWT access + rotating refresh tokens | P0 |
| FR-AUTH-07 | Logout current session and logout-all | P0 |
| FR-AUTH-08 | Profile: name, phone, avatar, notification prefs | P0 |
| FR-AUTH-09 | Super Admin platform console (orgs list only in Phase 1) | P1 |

### FR-CRM — CRM / contacts

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-CRM-01 | Leads with pipeline: New → Contacted → Qualified → Proposal → Negotiation → Won → Lost | P0 |
| FR-CRM-02 | Convert won lead → customer (copy fields, link original lead) | P0 |
| FR-CRM-03 | Customers: company, contacts, tags, owner, status | P0 |
| FR-CRM-04 | Contact timeline (notes, calls, emails logged, quotes, projects) | P0 |
| FR-CRM-05 | Follow-up reminders (creates calendar event + notification) | P0 |
| FR-CRM-06 | Search, filters, tags, archive | P0 |
| FR-CRM-07 | Communication history (manual log in MVP; Gmail/Outlook later) | P0 |
| FR-CRM-08 | Documents on customer (contracts via asset module) | P1 |

### FR-PRJ — Projects

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-PRJ-01 | Project statuses: Planning → Pre-Production → Production → Post-Production → Review → Approved → Delivered → Completed | P0 |
| FR-PRJ-02 | Fields: name, type, customer, dates, budget, PM, team, priority, tags, progress | P0 |
| FR-PRJ-03 | Create from approved quote | P0 |
| FR-PRJ-04 | Overview, timeline, tasks, notes, files, shoots, team, budget, quotes, invoices, activity | P0 |
| FR-PRJ-05 | Progress auto-computed from completed tasks (overridable) | P1 |

### FR-SHOOT — Production / shoots

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-SHOOT-01 | Shoot with date, call time, location, client, PM, crew, equipment, notes, expenses, weather JSON | P0 |
| FR-SHOOT-02 | Statuses: Planning → Scheduled → Ready → In Progress → Completed → Cancelled | P0 |
| FR-SHOOT-03 | Shot list per shoot | P0 |
| FR-SHOOT-04 | Shot fields: scene, description, camera, lens, location, talent, props, priority, status, notes, reference asset | P0 |
| FR-SHOOT-05 | Shot statuses: Planned → Ready → Shot → Retake → Approved | P0 |

### FR-TASK — Tasks & automation

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-TASK-01 | Tasks: title, description, project, customer, assignee, due, priority, status, category, dependencies, attachments | P0 |
| FR-TASK-02 | Statuses: Todo → In Progress → Review → Completed | P0 |
| FR-TASK-03 | Board (kanban) and list views | P0 |
| FR-TASK-04 | Automation engine: trigger → conditions → actions → log | P0 |
| FR-TASK-05 | Built-in: project→Production creates production checklist | P0 |
| FR-TASK-06 | Built-in: invoice overdue → finance follow-up task | P0 |
| FR-TASK-07 | Built-in: project Delivered → invoice reminder | P0 |

### FR-NOTE — Notes & collaboration

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-NOTE-01 | Notes on customer, project, shoot | P0 |
| FR-NOTE-02 | Comments on tasks, assets, quotes (internal vs client-visible) | P0 |
| FR-NOTE-03 | @mentions | P1 |
| FR-NOTE-04 | Activity timeline per entity | P0 |

### FR-FIN — Quotes, invoices, payments, expenses

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-FIN-01 | Quotes with line items, discount, tax, terms, validity | P0 |
| FR-FIN-02 | Quote statuses: Draft → Sent → Viewed → Approved → Rejected → Expired | P0 |
| FR-FIN-03 | Convert approved quote → project | P0 |
| FR-FIN-04 | Invoices with numbering `{ORG_PREFIX}-{YYYY}-{seq}` | P0 |
| FR-FIN-05 | Invoice statuses: Draft → Sent → Partially Paid → Paid → Overdue → Cancelled | P0 |
| FR-FIN-06 | Payments recorded against invoices (manual in MVP) | P0 |
| FR-FIN-07 | Expenses on project/shoot | P0 |
| FR-FIN-08 | Payment provider port (Stripe/Razorpay adapters, no live charge in MVP) | P1 |

### FR-AST — Assets

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-AST-01 | Types: image, video, audio, document, pdf, creative, contract, brand | P0 |
| FR-AST-02 | Lifecycle: Uploaded → Processing → Internal Review → Client Review → Approved → Delivered → Archived | P0 |
| FR-AST-03 | Folders, tags, project association, search, versioning, comments, download ACL | P0 |
| FR-AST-04 | Presigned upload to object storage | P0 |
| FR-AST-05 | Client sees only assets in Client Review / Approved / Delivered | P0 |

### FR-CAL — Calendar

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-CAL-01 | Unified events: shoots, tasks, deadlines, meetings, campaign launches, invoice dues | P0 |
| FR-CAL-02 | Day / week / month / agenda | P0 |
| FR-CAL-03 | Drag-drop reschedule (web) | P1 |
| FR-CAL-04 | Reminders | P0 |
| FR-CAL-05 | External calendar adapter interface (no live sync in MVP) | P1 |

### FR-MKT / FR-SEO / FR-ANL

Marketing campaigns + stored metrics (manual or adapter). SEO projects → websites → keywords → content → tasks → reports. Org analytics aggregating CRM + production + finance + marketing + SEO.

P0 for data model + UI with empty/stub states. P1 for live adapters.

### FR-RBAC

See [10-security.md](../architecture/10-security.md). Frontend never authoritative.

### FR-NOTIF

In-app notifications for assignments, reminders, approvals, finance events, mentions. Email via adapter. Push architected.

---

## 7. Quality requirements

| ID | Requirement |
|----|-------------|
| NFR-01 | Common CRUD p95 < 500ms on modest datasets |
| NFR-02 | Paginate all lists (default 25, max 100) |
| NFR-03 | WCAG 2.2 AA target |
| NFR-04 | Responsive: desktop, laptop, tablet, mobile — not a shrunk desktop |
| NFR-05 | Tenant isolation on every query |
| NFR-06 | Secrets only in environment |
| NFR-07 | Audit log for create/update/delete of financial and permission entities |

---

## 8. Personas (summary)

Full detail: [02-user-personas.md](./02-user-personas.md)

Production Manager, Marketer, SEO Specialist, Accountant, Admin/Owner, Team Member, Client, Super Admin.

---

## 9. Success

See [15-success-metrics.md](./15-success-metrics.md).
