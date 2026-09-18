# 08 — Database Design

**Engine:** PostgreSQL 16  
**Keys:** UUID primary keys  
**Timestamps:** `created_at`, `updated_at` timestamptz  
**Soft delete:** `deleted_at` where noted  
**Tenant:** `organization_id` on all org data

Money is stored as **integer minor units** (paise/cents) + `currency` ISO-4217.

---

## 1. ERD (logical)

```
organizations
    ├── users  (users.organization_id nullable for super_admin)
    ├── roles, permissions, role_permissions, user_roles
    ├── invites, refresh_tokens, email_tokens
    ├── customers
    │     └── contacts
    ├── leads  → optional converted_customer_id
    ├── lead_activities
    ├── catalog_items
    ├── projects
    │     ├── project_members
    │     ├── project_tasks (tasks)
    │     ├── project_budget_items
    │     ├── shoots
    │     │     ├── shoot_crew
    │     │     ├── shoot_equipment
    │     │     └── shots  (shot_lists conceptually grouped by shoot)
    │     └── assets → asset_versions, asset_comments
    ├── quotes → quote_items
    ├── invoices → invoice_items → payments
    ├── expenses
    ├── notes, comments, activities
    ├── calendar_events
    ├── marketing_campaigns → marketing_metrics
    ├── seo_projects → seo_keywords, seo_metrics, seo_content
    ├── notifications, notification_preferences
    ├── automation_rules → automation_actions, automation_logs
    ├── integrations
    ├── equipment
    ├── audit_logs
    └── resource_grants   (client → project/customer ACL)
```

---

## 2. Table definitions

### organizations
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| name | text not null | |
| slug | text unique | |
| timezone | text | default Asia/Kolkata |
| currency | char(3) | INR |
| invoice_prefix | text | KX |
| logo_url | text | |
| settings | jsonb | tax rates, features |
| created_at, updated_at, deleted_at | timestamptz | |

### users
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| organization_id | uuid FK | null = platform super admin |
| email | citext | unique globally |
| password_hash | text | |
| first_name, last_name, phone, avatar_url | text | |
| status | text | active, invited, disabled |
| email_verified_at | timestamptz | |
| last_login_at | timestamptz | |
| created_at, updated_at, deleted_at | | |

Unique: `email`. Index: `(organization_id, status)`.

### roles
id, organization_id nullable (system roles org_id null), `key` (admin, production_manager, …), name, is_system bool.

System roles seeded; orgs may clone custom roles later.

### permissions
id, key (`projects.write`), module, description.

### role_permissions
role_id, permission_id unique pair.

### user_roles
user_id, role_id, organization_id.

### refresh_tokens
id, user_id, family_id, token_hash, expires_at, revoked_at, user_agent, ip.

### email_tokens
id, user_id, purpose (`verify`|`reset`|`invite`), token_hash, expires_at, consumed_at.

### invites
id, organization_id, email, role_key, invited_by, token_hash, expires_at, accepted_at.

### customers
id, organization_id, display_name, company_name, status (`active`|`inactive`|`archived`), website, industry, billing_address jsonb, shipping_address jsonb, assigned_user_id, tags text[], source, notes_summary, created_at, updated_at, deleted_at.

Indexes: `(organization_id, display_name)`, gin(tags), trigram on display_name.

### contacts
id, organization_id, customer_id, first_name, last_name, email, phone, title, is_primary, created_at, updated_at, deleted_at.

### leads
id, organization_id, customer_id nullable, company_name, contact_name, email, phone, source, service_interest, status (pipeline enum), assigned_user_id, estimated_value_minor bigint, currency, lost_reason, converted_customer_id, converted_at, tags, created_at, updated_at, deleted_at.

Index: `(organization_id, status)`.

### lead_activities
id, organization_id, lead_id, type (`note`|`call`|`email`|`status_change`), body, actor_user_id, meta jsonb, created_at.

### projects
id, organization_id, customer_id, quote_id nullable, code (human, unique per org), name, project_type, description, start_date, end_date, budget_minor, currency, manager_id, status, priority (`low`|`medium`|`high`|`urgent`), progress numeric(5,2), tags, created_at, updated_at, deleted_at.

Unique `(organization_id, code)`.

### project_members
project_id, user_id, role_on_project, unique pair.

### tasks
id, organization_id, project_id nullable, customer_id nullable, shoot_id nullable, title, description, assignee_id, due_at, priority, status, category (`production`|`post`|`finance`|`marketing`|`seo`|`general`), parent_id, created_at, updated_at, deleted_at.

### task_dependencies
task_id, depends_on_id.

### shoots
id, organization_id, project_id, name, shoot_date, call_time, wrap_time, location_name, location_address, location_geo point, client_contact_id, manager_id, status, production_notes, weather jsonb, created_at, updated_at, deleted_at.

### shoot_crew
shoot_id, user_id nullable, external_name, crew_role.

### equipment
id, organization_id, name, category, serial, status (`available`|`in_use`|`maintenance`).

### shoot_equipment
shoot_id, equipment_id, notes.

### shots
id, organization_id, shoot_id, shot_code, scene, description, camera, lens, location, talent, props, priority, status, notes, reference_asset_id, sort_order, created_at, updated_at.

### assets
id, organization_id, project_id, customer_id, folder_id, type, title, storage_key, mime, size_bytes, checksum, status, visibility (`internal`|`client`), current_version, created_by, created_at, updated_at, deleted_at.

### asset_folders
id, organization_id, project_id, parent_id, name.

### asset_versions
id, asset_id, version, storage_key, created_by, created_at.

### asset_comments
id, asset_id, user_id, body, is_client_visible, created_at.

### notes
id, organization_id, entity_type, entity_id, body, is_client_visible, author_id, created_at, updated_at.

### comments
id, organization_id, entity_type, entity_id, body, is_client_visible, author_id, mention_user_ids uuid[], created_at.

### activities
id, organization_id, entity_type, entity_id, actor_id, verb, summary, meta jsonb, created_at.

Index: `(organization_id, entity_type, entity_id, created_at desc)`.

### quotes
id, organization_id, customer_id, project_id nullable, number, status, currency, subtotal_minor, discount_minor, tax_minor, total_minor, terms, valid_until, client_notes, internal_notes, sent_at, viewed_at, approved_at, converted_project_id, public_token_hash, created_at, updated_at, deleted_at.

### quote_items
id, quote_id, catalog_item_id nullable, description, quantity numeric, unit_price_minor, tax_rate_bps int, discount_minor, position.

### invoices
id, organization_id, customer_id, project_id, quote_id, number, status, currency, subtotal_minor, discount_minor, tax_minor, total_minor, amount_paid_minor, due_date, issued_at, sent_at, public_token_hash, created_at, updated_at, deleted_at.

### invoice_items
same shape as quote_items.

### payments
id, organization_id, invoice_id, amount_minor, currency, method (`bank`|`upi`|`cash`|`stripe`|`razorpay`|`other`), provider, provider_ref, paid_at, status, created_at.

### expenses
id, organization_id, project_id, shoot_id, category, amount_minor, currency, vendor, incurred_on, receipt_asset_id, created_by, created_at.

### catalog_items
id, organization_id, kind (`service`|`product`), name, default_price_minor, tax_rate_bps, is_active.

### calendar_events
id, organization_id, type, title, starts_at, ends_at, all_day, entity_type, entity_id, location, reminder_minutes int[], created_at, updated_at.

### marketing_campaigns
id, organization_id, customer_id, project_id, platform, name, status, budget_minor, currency, starts_on, ends_on, external_id, created_at, updated_at.

### marketing_metrics
id, campaign_id, date, spend_minor, impressions, clicks, leads, conversions, revenue_minor, raw jsonb.

Unique `(campaign_id, date)`.

### seo_projects
id, organization_id, customer_id, website_url, name, status, created_at, updated_at.

### seo_keywords
id, seo_project_id, keyword, locale, target_url, created_at.

### seo_metrics
id, seo_keyword_id, captured_on, position, clicks, impressions, ctr, source (`manual`|`gsc`).

### seo_content
id, seo_project_id, title, url, status, keyword_id.

### notifications
id, organization_id, user_id, type, title, body, entity_type, entity_id, read_at, created_at.

### notification_preferences
user_id, channel (`in_app`|`email`|`push`), type, enabled.

### automation_rules
id, organization_id, name, trigger_type, is_enabled, created_at, updated_at.

### automation_conditions
id, rule_id, field, op, value jsonb.

### automation_actions
id, rule_id, action_type, params jsonb, position.

### automation_logs
id, rule_id, entity_type, entity_id, status, message, created_at.

### integrations
id, organization_id, provider, status, credentials_encrypted, meta jsonb, created_at.

### resource_grants
id, organization_id, user_id, resource_type (`customer`|`project`), resource_id.

### audit_logs
id, organization_id, actor_id, action, entity_type, entity_id, before jsonb, after jsonb, ip, created_at.

Index: `(organization_id, created_at desc)`.

---

## 3. Index recommendations (additional)

- `tasks (organization_id, assignee_id, status, due_at)`
- `shoots (organization_id, shoot_date)`
- `invoices (organization_id, status, due_date)`
- `assets (organization_id, project_id, status)`
- `leads (organization_id, assigned_user_id, status)`

---

## 4. Multi-tenant strategy

1. **Mandatory org_id** on tenant rows.  
2. **Repository layer** always filters `organization_id = ctx.org_id AND deleted_at IS NULL`.  
3. **Future RLS:** `SET app.organization_id` and policies. Designed, not shipped Phase 1.  
4. Cross-tenant UUID access → 404.

---

## 5. Audit strategy

- Append-only `audit_logs` for quotes, invoices, payments, roles, users, settings, automation.
- Application activities (`activities`) are the product timeline (human readable).
- Financial documents never hard-deleted; `cancelled` + soft delete admin only.
- PDFs stored in object storage; key recorded on quote/invoice.

---

## 6. Sequences

`organizations.invoice_seq` and `quote_seq` via table `org_counters (organization_id, kind, value)` with row lock on increment — avoids Postgres SEQUENCE permission issues per tenant.
