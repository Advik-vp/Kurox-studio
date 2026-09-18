# 10 — Security

## 1. Principles

- Never trust the frontend.
- Tenant isolation is a security control, not a filter UX.
- Secrets never in the SPA or mobile binaries.
- Financial and ACL mutations are audited.

---

## 2. Transport & session

- TLS 1.2+ in staging/production.
- Access JWT 15 minutes, signed HS256 (dev) / RS256 (prod recommended).
- Refresh 30 days, hashed at rest, **rotated** on use.
- Refresh reuse: revoke entire `family_id`.
- `logout` revokes one token; `logout-all` revokes all families for user.
- Password: Argon2id (or bcrypt fallback) min 10 chars.

---

## 3. Authorization

Two layers:

1. **RBAC** — permission keys on roles.
2. **Resource-level** — `resource_grants` for clients; project membership for team members; “assigned financial read” for PMs.

Implementation: `require_permission("invoices.write")` + `ensure_customer_in_org(id)` + `ensure_client_grant`.

---

## 4. Input & output

- Pydantic validation all bodies.
- UUID path params.
- SQLAlchemy parameters only — no string-built SQL.
- Output encoding in React (default). Sanitize notes if rendering markdown (disallow raw HTML).
- CORS allowlist exact web/mobile origins.

---

## 5. Rate limiting

- Auth: 5 login failures / 15 min / email+IP then lockout notice.
- Global authenticated: 120 req/min / user.
- Public quote pages: 30 / min / IP.

---

## 6. Uploads

- Allowlist MIME + extension match.
- Max 50MB direct; larger multipart presign.
- Store outside web root (object storage).
- Virus scan hook (ClamAV) optional in worker — interface only in MVP.
- Do not trust client-provided MIME for serving; store detected type.

---

## 7. CSRF

SPA uses Bearer tokens (not cookie access) → CSRF low. If cookie fallback is added, SameSite=strict + CSRF token.

---

## 8. XSS / clickjacking

- CSP on web hosting.
- `X-Frame-Options: DENY`
- No `dangerouslySetInnerHTML` except sanitised markdown later.

---

## 9. Privacy & tenancy

- 404 on cross-tenant IDs.
- Clients must not see internal notes (`is_client_visible=false`).
- Audit logs not visible to clients.

---

## 10. Secrets

- `.env` gitignored. `.env.example` committed empty of secrets.
- Integration credentials encrypted at rest (`credentials_encrypted`) with `KMS_KEY`.
- No API keys in frontend except public Stripe *publishable* if ever used — charges stay server-side.

---

## 11. Backups

- Daily Postgres dumps, 7-day retention staging, 30-day prod (ops).
- Point-in-time if provider supports.
- Object storage versioning enabled in prod.

---

## 12. Password reset

- Token 1 hour, single use, hashed.
- Same response whether email exists.
- Invalidate refresh tokens on reset.

---

## 13. Email verification

- Required before inviting others and before sending quotes (org setting, default on).
