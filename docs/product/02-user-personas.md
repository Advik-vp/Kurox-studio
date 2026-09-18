# 02 — User Personas

Kurox is designed around studio jobs-to-be-done, not generic “sales user” templates.

---

## A. Production Manager — “Arjun”

**Goal:** Get the shoot done on time, with the right crew, without losing shots or client notes.

**Daily questions:** What is shooting today? What is blocked? Which assets are still in review? Which projects slip this week?

**Needs:** customers, projects, shoots, locations, crew, tasks, shot lists, equipment, assets, deadlines, production notes, progress.

**Dashboard widgets (default):** today’s shoots, upcoming shoots, active projects, overdue tasks, pending approvals, production alerts, asset status.

**Permissions (default):** CRM read/write, projects full, shoots full, tasks full, assets full, calendar write, finance **read assigned projects only**, marketing/SEO read if project-linked.

**Mobile:** primary user. Check-in, shot status, notes, photo capture, crew list.

**Pain if Kurox fails:** they fall back to WhatsApp groups and a Google Sheet shot list.

---

## B. Marketing Manager — “Meera”

**Goal:** Prove campaign ROI and keep client retainers accountable.

**Needs:** campaigns, spend, leads, conversions, CTR/CPC/ROAS, budgets, marketing tasks, client mapping.

**Dashboard:** active campaigns, spend, leads, conversions, CTR, CPC, ROAS, status.

**Permissions:** CRM (leads), marketing full, projects read, finance read (budgets of assigned campaigns), SEO read.

**MVP honesty:** she can create campaigns and enter/import metrics. Live Ads connectors are Phase 3; the UI must say “Not connected” instead of inventing numbers.

---

## C. SEO Specialist — “Kabir”

**Goal:** Track rankings, technical health, and content delivery per client site.

**Needs:** SEO projects, keywords, rankings, organic traffic, technical tasks, backlinks, content, site health, reports.

**Dashboard:** organic traffic, rankings, CTR, impressions, indexed pages, health, backlinks, content performance.

**Structure:** Client → Website → SEO Project → Keywords → Content → Tasks → Reports.

**Permissions:** SEO full, CRM read (assigned customers), tasks in SEO category, analytics SEO slice.

---

## D. Accountant / Finance Manager — “Nisha”

**Goal:** Quote accurately, invoice on delivery, collect cash, see project profit.

**Needs:** customers, quotes, invoices, payments, expenses, tax, budgets, P&L, aging, reports.

**Dashboard:** revenue, outstanding, paid, pending, expenses, profit, monthly revenue, project profitability.

**Permissions:** CRM read, projects read, quotes/invoices/payments/expenses full, analytics finance, no production write.

**Critical:** invoice numbering must be sequential and gap-controlled per org; quotes once approved are immutable except void+revision.

---

## E. Admin / Owner — “Dev”

**Goal:** See the studio as a business: pipeline, utilization, cash, reputation of delivery.

**Needs:** users, permissions, all modules, settings, audit logs, high-level KPIs.

**Dashboard:** org KPIs, alerts (overdue invoices, delayed projects, shoots without crew).

**Permissions:** all within organization. Cannot access other orgs.

---

## F. Client — “Priya (Brand side)”

**Goal:** Know status, approve work, pay, stop chasing the studio on WhatsApp.

**Needs:** their projects only, status, approve/reject deliverables, view/approve quotes, view invoices, download allowed docs, comments, selected assets, messages.

**Does not see:** internal notes, crew rates, other clients, automation, team salaries, unapproved assets.

**Entry:** invite link → set password → client portal shell (reduced nav).

---

## G. Team Member — “Ravi (Editor / PA / Camera)”

**Goal:** Know assigned tasks and shoot call times.

**Needs:** assigned tasks, assigned shoots, notes on those entities, asset upload on assigned projects.

**Does not see:** org-wide finance, other clients’ full CRM, settings.

---

## H. Super Admin — Kurox operator

Platform-level: list organizations, impersonation **disabled in MVP**, billing of tenants (future). Not an org user.

---

## Persona → navigation emphasis

| Persona | Default home | Hidden or deemphasized |
|---------|--------------|------------------------|
| Production Manager | Dashboard (production) | SEO deep nav |
| Marketer | Marketing | Shot lists |
| SEO | SEO | Shoots |
| Accountant | Finance | Production write |
| Admin | Dashboard (all) | — |
| Client | My projects | Entire internal IA |
| Team Member | My tasks / today’s shoot | Finance, settings |
