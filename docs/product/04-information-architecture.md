# 04 — Information Architecture

## 1. Desktop navigation (internal users)

```
KUROX
Dashboard

CRM
 ├── Leads
 ├── Customers
 ├── Contacts
 └── Activities

Production
 ├── Projects
 ├── Shoots
 ├── Shot Lists
 ├── Tasks
 └── Assets

Marketing
 ├── Campaigns
 ├── Ads
 └── Analytics

SEO
 ├── Projects
 ├── Keywords
 ├── Content
 └── Reports

Finance
 ├── Quotes
 ├── Invoices
 ├── Payments
 └── Expenses

Calendar
Analytics
Automation
Team
Settings
```

**Command palette (⌘K / Ctrl+K):** jump to customer, project, shoot, invoice, create actions.

Nav items hide if the role lacks `*.read`. Never hide as the only security.

---

## 2. Client portal navigation

```
My Dashboard
Projects
Approvals
Quotes
Invoices
Files
Messages
Account
```

---

## 3. Mobile IA

**Bottom tabs (internal):** Home · Schedule · Tasks · CRM · More

**More drawer:** Projects, Assets, Finance (if permitted), Notifications, Settings

**FAB:** contextual — Home: + Task / + Shoot / + Note; CRM: + Lead; Project: + Task / + Shoot

**Client mobile tabs:** Home · Projects · Approvals · Account

---

## 4. Object hierarchy

```
Organization
 ├── Users, Roles, Invites
 ├── Customers
 │    ├── Contacts
 │    ├── Leads (pre-conversion, still org-scoped)
 │    ├── Notes, Activities
 │    ├── Quotes → Quote items
 │    ├── Projects
 │    │    ├── Members, Tasks, Notes
 │    │    ├── Shoots → Crew, Equipment, Shots
 │    │    ├── Assets → Versions, Comments
 │    │    ├── Invoices → Items, Payments
 │    │    ├── Marketing campaigns → Metrics
 │    │    └── SEO projects → Keywords, Content, Tasks
 │    └── Invoices (can exist without project for retainers)
 ├── Catalog (services/products)
 ├── Equipment
 ├── Calendar events
 ├── Automation rules
 ├── Notifications
 └── Audit logs
```

---

## 5. URL map (web)

| Path | Screen |
|------|--------|
| `/login` `/signup` `/forgot-password` `/reset-password` | Auth |
| `/app` | Dashboard |
| `/app/crm/leads` `/app/crm/leads/:id` | Leads |
| `/app/crm/customers` `/app/crm/customers/:id` | Customers |
| `/app/crm/contacts` | Contacts |
| `/app/crm/activities` | Activities |
| `/app/production/projects` `/app/production/projects/:id` | Projects |
| `/app/production/shoots` `/app/production/shoots/:id` | Shoots |
| `/app/production/tasks` | Tasks |
| `/app/production/assets` | Assets |
| `/app/marketing/campaigns` | Campaigns |
| `/app/seo/projects` | SEO |
| `/app/finance/quotes` `/app/finance/quotes/:id` | Quotes |
| `/app/finance/invoices` `/app/finance/invoices/:id` | Invoices |
| `/app/calendar` | Calendar |
| `/app/analytics` | Analytics |
| `/app/automation` | Automation |
| `/app/team` | Team |
| `/app/settings` | Settings |
| `/client` | Client home |
| `/client/projects/:id` | Client project |

Invite: `/invite/:token`  
Quote public view: `/p/quotes/:token`  
Invoice public view (optional): `/p/invoices/:token`

---

## 6. Cross-links (must work)

- Customer → Projects, Quotes, Invoices, Payments, Notes, Activity
- Project → Customer, Shoots, Tasks, Assets, Quotes, Invoices, Campaigns, SEO
- Shoot → Project, Calendar, Shot list, Expenses
- Quote → Customer, Convert Project, Invoice
- Asset → Project, Version history, Approvals
- Task → Project, Customer, Calendar
