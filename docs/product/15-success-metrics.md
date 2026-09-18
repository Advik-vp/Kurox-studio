# 15 — Success Metrics

Instrument from day one via `activities` + table counts. Do not wait for a BI tool.

## Product adoption

| Metric | Definition | MVP target (90 days, single studio beta) |
|--------|------------|------------------------------------------|
| WAU / MAU | Distinct users with a write or dashboard view | WAU ≥ 60% of seats |
| Projects created | `projects` inserts | ≥ 8 / month |
| Customers added | | ≥ 15 / month |
| Tasks completed | status → completed | ≥ 70% of created |

## Operational efficiency

| Metric | Definition |
|--------|------------|
| Lead → project time | `leads.converted_at` to first project |
| Quote → approval | `sent_at` to `approved_at` |
| Task completion rate | completed / created (excl cancelled) |
| Project completion rate | completed / (completed+cancelled) |
| Overdue task rate | open tasks `due_at < now` |

## Financial

Invoice processing time (created → sent), collection time (sent → paid), revenue tracked (sum paid), outstanding value (open invoices).

## Marketing / SEO

Campaigns with ≥1 metric row; leads with source marketing; ROAS when revenue_minor present; keywords with ≥2 snapshots; SEO tasks completed.

## UX

Feature adoption (module DAU), API 5xx rate < 0.5%, support tickets, 4-week retention, median client approval time.

## Instrumentation

`GET /analytics/dashboard` is the product view. Internal `analytics_events` (future) for UI clicks. For MVP, SQL from domain tables is sufficient.
