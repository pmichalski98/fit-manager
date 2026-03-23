# Implementation Tasks — VPS Migration & Performance Optimization

## Task 1: Next.js configuration for standalone output ✅

- [x] 1.1 Add `output: "standalone"` to `next.config.js`
- [x] 1.2 Install `sharp` as a production dependency
- [x] 1.3 Reduce Sentry `tracesSampleRate` from 1.0 to 0.2 in all instrumentation configs
- [x] 1.4 Verify `npm run build` succeeds and `.next/standalone` directory is created (79MB vs 928MB node_modules)

## Task 2: Docker setup ✅

- [x] 2.1 Create `Dockerfile` (multi-stage: bun deps → bun build → bun runner) using standalone output
- [x] 2.2 Create `.dockerignore`
- [x] 2.3 Create `docker-compose.yml` with `app` (port 3002) and `db` (postgres:17) services
- [x] 2.4 Create `.env.production.example` with all required env vars documented
- [x] 2.5 Add `trustedDependencies` for `sharp` and `unrs-resolver` in package.json
- [x] 2.6 Add entrypoint script with automatic Drizzle migrations on startup

## Task 3: Database migration ✅

- [x] 3.1 Export production database from Neon using `pg_dump` (via Docker container on VPS)
- [x] 3.2 Import dump into local PostgreSQL 17 container
- [x] 3.3 Verify data integrity

## Task 4: CI/CD pipeline ✅

- [x] 4.1 Create `.github/workflows/deploy.yml` — GHCR-based (build in CI, pull on VPS)
- [x] 4.2 Add all GitHub secrets
- [x] 4.3 Deployment tested and working

## Task 5: Backup script ✅

- [x] 5.1 Create `scripts/backup.sh` (pg_dump + gzip + 30-day retention)
- [ ] 5.2 Set up cron job on VPS: `0 3 * * *` to run backup daily
- [ ] 5.3 Verify backup produces a valid, restorable dump

## Task 6: VPS setup & Caddy ✅

- [x] 6.1 App running on VPS port 3002
- [ ] 6.2 Add Caddy site block for fit-manager domain → `reverse_proxy localhost:3002`
- [ ] 6.3 Point DNS to VPS
- [ ] 6.4 Update OAuth callback URLs (GitHub, Google) to point to the new domain

## Task 7: Cleanup ✅

- [x] 7.1 Remove `@vercel/speed-insights` dependency and usage
- [x] 7.2 Remove `automaticVercelMonitors` from next.config.js
- [x] 7.3 Remove debug `onValidationError` from env.js
- [x] 7.4 Update `drizzle.config.ts` to use `process.env.DATABASE_URL` directly
- [x] 7.5 Remove unused migration file

## Port Map (VPS)

| App                | Port     |
| ------------------ | -------- |
| zawszeodbiera web  | 3000     |
| personal-assistant | 3001     |
| **fit-manager**    | **3002** |
| zawszeodbiera api  | 4000     |
| Caddy              | 80, 443  |
