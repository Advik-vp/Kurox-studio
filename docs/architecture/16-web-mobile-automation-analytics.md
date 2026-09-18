# Web, mobile, automation, analytics architecture (Parts N–Q)

## Web (SPA)

- Vite + React 18 + TypeScript
- Shell: `AppShell` with persona-filtered nav
- Server state: TanStack Query
- Auth: JWT in localStorage (starter). Move to httpOnly cookies before public launch if XSS budget requires it.
- Route guards: unauthenticated → login; `client` role → `/client`
- API client refreshes access tokens once on 401
- Design tokens in Tailwind (`kx-*`)
- Command palette Ctrl+K is **visual placeholder** in header (not wired)

## Mobile (Expo)

Operational subset: home, schedule, tasks, CRM, more drawer, login via SecureStore.

Not in this starter (Phase 4): camera capture → presign upload, push (Expo notifications), offline queue, location for call sheets.

Same API base URL (`EXPO_PUBLIC_API_BASE_URL`). Android emulator must use `10.0.2.2` instead of localhost.

## Automation

Engine: `run_project_status_automations` + `run_invoice_overdue`.

Registry pattern: add trigger handlers in `app/services/domain.py` without changing routers.

Built-in rules seeded:

1. Project → Production → production checklist tasks
2. Invoice overdue → finance follow-up (job to be scheduled on Celery beat)
3. Project → Delivered → invoice reminder task

UI lists rules; visual WHEN/IF/THEN builder is Phase 5.

## Analytics

`GET /analytics/dashboard` aggregates SQL (not a warehouse). Marketing/SEO sections return `connected: false` rather than invented metrics.

Date-range query params are specified for Phase 2; starter uses current org totals.

Future: nightly snapshot table `analytics_daily` filled by Celery, then dashboards read snapshots.
