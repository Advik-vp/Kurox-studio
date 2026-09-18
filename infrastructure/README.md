# Infrastructure

Local services live in the repo-root `docker-compose.yml`:

- Postgres 16 (`kurox` / `kurox` / db `kurox`) on 5432
- Redis 7 on 6379
- MinIO (S3-compatible) on 9000 / console 9001
- Mailhog SMTP 1025 / UI 8025

Production (Phase 2+): Terraform or equivalent for RDS, ElastiCache, S3/R2, and container services. Do not commit secrets; use a secrets manager.
