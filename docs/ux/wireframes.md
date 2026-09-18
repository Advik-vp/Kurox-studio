# Wireframes (low-fidelity)

Text wireframes for the 25 MVP screens. Visual implementation uses the Kurox design system.

---

## 1. Login

```
[ full viewport dark ]
        KUROX
        Studio Operations. CRM. Production. Growth.
        ┌─────────────────────┐
        │ Email               │
        │ Password            │
        │ [ Sign in ]         │
        │ Forgot password     │
        │ Create organization │
        └─────────────────────┘
```

Empty N/A. Loading: button pending. Error: banner “Invalid email or password”. Mobile: padded 16px, 44px controls.

---

## 2. Signup

Same canvas. Fields: Organization, First name, Last name, Email, Password, Confirm. Primary: Create workspace.

---

## 3. Dashboard

```
Good morning, Arjun                    [Search] [Bell] [Avatar]
[Active projects][Upcoming shoots][Open leads][Revenue][Outstanding][Tasks]
┌ Pipeline bar ┐ ┌ Today tasks ┐ ┌ Upcoming shoots ┐
┌ Revenue line ┐ ┌ CRM activity┐ ┌ Assets thumbs   ┐
```

Empty: first-run checklist. Loading: skeletons. Error: retry banner.

---

## 4. CRM lead list

Filters row + “New lead”. Table 7 columns. Drawer on row. Empty: “No leads yet”. Mobile cards.

---

## 5. Customer profile

EntityHeader + tabs (Overview…Activity). Overview 2-column fields + KPI chips (projects, outstanding).

---

## 6. Project list

Filters type/status/PM. Table: code, name, customer, status stepper mini, progress, dates, PM.

---

## 7. Project details

LifecycleStepper. Tabs. Overview: next shoot, overdue tasks, budget vs spent, recent assets.

---

## 8. Shoot / 9. Shot list

Call sheet header (date, call time, location, weather placeholder). Crew, equipment, notes. Shot table.

---

## 10. Task board

Four columns. Card: title, project, due, assignee. Toggle list.

---

## 11. Asset library

Left folders. Grid. Preview drawer with versions + comments + approve.

---

## 12. Calendar

Day/Week/Month/Agenda. Color legend. Event popover → entity.

---

## 13–14. Quote / Invoice builders

Line table + totals rail + preview. Status badge. Send / Record payment.

---

## 15–17. Marketing / SEO / Analytics

Filter bar. Charts only with data. Integration banner if adapter NoOp.

---

## 18. Automation

Rule cards. Editor: WHEN / IF / THEN. Log table.

---

## 19. Team

Invite + table (name, email, role, status).

---

## 20. Settings

Subnav: Organization, Branding, Finance defaults, Integrations, Notifications, Audit.

---

## 21. Client portal

My projects cards. Approvals inbox. Quotes/Invoices. No sidebar modules.

---

## 22. Mobile dashboard

Greeting. Today schedule. Counts. FAB. Bottom tabs.

---

## 23–25. Mobile project / shoot / tasks

Status stepper; call sheet + shot checkoff; my-tasks swipe.

Full interaction notes: [05-ux-specification.md](./05-ux-specification.md)
