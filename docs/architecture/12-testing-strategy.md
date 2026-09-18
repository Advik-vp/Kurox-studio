# 12 — Testing Strategy

## Unit

- Password hashing, money math (tax, discount, partial payments).
- Quote → project conversion mapping.
- Invoice status transitions (including overdue).
- Automation condition matcher.
- Permission resolver.
- Tenant filter helper.

## Integration (API + DB)

- Register → verify → login → refresh rotation → reuse detection.
- CRUD customer isolated by org (two orgs, UUID leak → 404).
- Lead convert.
- Quote send + public approve + convert.
- Invoice send numbering monotonic.
- Shoot + shots.
- Client cannot read internal notes.
- Role 403 matrix smoke.

## E2E (Playwright web)

1. Login  
2. Create customer  
3. Create project  
4. Create shoot  
5. Create quote  
6. Create invoice  
7. Client approval happy path  
8. Client forbidden on `/app/team`

## Mobile

- Detox/Maestro later. Starter: component tests + manual checklist Android/iOS.
- Offline: airplane mode shows cached today schedule.

## Performance

- List endpoints with 10k customers still paginated (seed script optional).

## Fixture policy

`tests/` uses factory-boy/pytest fixtures. Never production credentials.

Starter includes:

- `apps/api/tests/test_health.py`
- `apps/api/tests/test_auth.py`
- `apps/web` vitest example for money formatter
