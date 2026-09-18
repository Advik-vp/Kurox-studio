# 05 — UX Specification

## 1. Product feel

Kurox should feel like a **studio control room**: dense on desktop, glanceable on mobile, cinematic but quiet. Not a bank ledger. Not a social app.

Principles:

1. **Lifecycle first.** Status is always visible and named in studio language (Pre-Production, Call time, Client Review).
2. **One object, many facets.** Customer and Project pages are hubs, not dead-end records.
3. **Honest empty states.** “No campaigns connected” is better than a fake ROAS of 0.
4. **Speed of capture.** Creating a lead, shot, or note should be possible in under 15 seconds.
5. **Persona homes.** Same app, different default widgets and nav weights.
6. **Color is not the only status.** Badges include text + icon.

---

## 2. Shell (desktop)

```
┌──────────────────────────────────────────────────────────┐
│ [KUROX]  Command search          [?] [Bell] [Avatar]     │
├──────────┬───────────────────────────────────────────────┤
│ Sidebar  │ Breadcrumb · Page title · Primary action      │
│ (w-64,   ├───────────────────────────────────────────────┤
│ collapsible│ Page content (max density tables + cards)   │
│ to icons)│                                               │
│          │                                               │
└──────────┴───────────────────────────────────────────────┘
```

- Sidebar collapse stored in local preferences.
- Header search opens command palette.
- Notifications drawer from bell.

---

## 3. Screen specifications

For every screen: layout, components, data, actions, empty/loading/error, responsive.

### 3.1 Login

- Centered card on dark canvas; KUROX wordmark; tagline.
- Fields: email, password, Remember this device (refresh persistence).
- Actions: Sign in, Forgot password, Create organization.
- Error: inline + alert for invalid credentials (generic message).
- Loading: button spinner, fields disabled.
- Responsive: full-width card on mobile with larger touch targets.

### 3.2 Signup

- Org name, full name, email, password, confirm, accept terms.
- Password hints (min 10, mixed).
- Success → verify email interstitial.

### 3.3 Dashboard (command center)

**Header:** “Good morning, {firstName}” + date + org name.

**KPI row (6):** Active Projects, Upcoming Shoots, Open Leads, Revenue (MTD), Outstanding, Tasks due today. Each card: value, delta vs last period, link.

**Main grid:**

| Widget | Content |
|--------|---------|
| Project pipeline | Horizontal counts by status (bar) |
| Today’s tasks | List, check-off |
| Upcoming shoots | Next 7 days |
| Recent CRM activity | Timeline |
| Revenue | Line, last 6 months |
| Campaign performance | Table or “Connect ads” empty |
| SEO performance | Sparkline or empty |
| Recent assets | Thumbnails |
| Notifications | Latest 5 |

**Empty:** first-run checklist (invite team, add customer, create project).  
**Loading:** skeleton cards.  
**Error:** banner with retry.  
**Responsive:** KPI 2-col tablet, 1-col mobile; widgets stack.  
**Future:** widget customization (layout JSON on user prefs) — not MVP.

### 3.4 CRM lead list

- Filters: status, owner, source, tags, date.
- Table: name, company, status badge, owner, last activity, next follow-up.
- Row click → lead detail drawer.
- Empty: illustration + New lead.
- Mobile: cards with status + call/mail icon buttons.

### 3.5 Customer profile

**Header:** name, tags, owner, status, primary CTA (New project, New quote).

**Tabs:** Overview · Contacts · Projects · Quotes · Invoices · Files · Notes · Activity

Overview: company fields, address, health (open projects, outstanding).

### 3.6 Project list / 3.7 Project details

List: filters type/status/PM; progress bar; dates.

Details tabs: Overview · Timeline · Tasks · Shoots · Assets · Team · Budget · Quotes · Invoices · Notes · Activity

Overview: status stepper (production lifecycle), next shoot, blockers.

### 3.8 Shoot management

Header: date, call time, location map placeholder, status.

Sections: crew chips, equipment checklist, notes, expenses, shot list preview.

Actions: Start shoot, Complete, Cancel, Duplicate.

### 3.9 Shot list

Table or board by status. Inline edit. Reference thumb. Mobile: swipe to mark Shot / Retake.

### 3.10 Task board

Kanban 4 columns. Drag-drop. Filters project/assignee. List toggle. Dependency icon.

### 3.11 Asset library

Folder tree + grid/list. Type filters. Preview drawer (image/pdf; video player). Version stack. Approve/request changes if permitted.

### 3.12 Calendar

Toolbar: Day Week Month Agenda. Color by type (shoot, task, finance, meeting). Drag-drop P1. Click → entity.

### 3.13 Quote builder

Left: line items editor. Right: live totals (subtotal, discount, tax, total). Preview pane. Send / Convert.

### 3.14 Invoice builder

Same pattern + payments panel + status + PDF.

### 3.15–3.17 Marketing, SEO, Analytics dashboards

Filters: client, project, date, platform. Charts only when data exists. Stub integration banners.

### 3.18 Automation builder

List of rules. Editor: When [trigger] If [conditions] Then [actions]. Execution log table. Toggle enable.

### 3.19 Team

User table, invite, role change, deactivate. Cannot remove last admin.

### 3.20 Settings

Org profile, branding (logo), currency/timezone, invoice prefix, tax defaults, integrations (disabled cards), notification defaults, audit log (admin).

### 3.21 Client portal

Reduced chrome. Project cards with % and next milestone. Approvals inbox. Quote/invoice list.

### 3.22–3.25 Mobile

**Home:** greeting, today’s schedule, due tasks count, upcoming shoots, active projects, notifications, FAB quick actions.

**Project:** status stepper, next shoot, tasks assigned to me, files.

**Shoot:** call sheet, crew, shot list checkoff, note + camera capture.

**Tasks:** My tasks, swipe complete, filter.

---

## 4. Interaction patterns

- **Create:** Drawer (md+), full-screen sheet (mobile).
- **Destroy:** Confirm dialog; financial docs prefer Cancel/Void.
- **Bulk:** checkboxes on tables (archive, assign, tag) P1.
- **Toasts:** success quiet; errors persistent until dismissed if destructive.
- **Unsaved changes:** guard on quote/invoice builders.

---

## 5. Accessibility

- Focus rings `2px accent`.
- Dialogs: focus trap, Esc, aria-modal.
- Forms: label + error `aria-describedby`.
- Charts: table alternative on request / data table under chart.
- `prefers-reduced-motion`: disable kanban animations and page fades.
- Touch targets ≥ 44px on mobile.
- Contrast: text on dark ≥ 4.5:1; gold accent used with dark text on badges.

---

## 6. Responsive rules

| Breakpoint | Nav | Tables |
|------------|-----|--------|
| < 768 | Bottom nav + drawer | Cards |
| 768–1279 | Collapsible sidebar overlay | Horizontal scroll or simplified columns |
| ≥ 1280 | Persistent sidebar | Full tables |

Do not scale desktop sidebar into a 320px screen.
