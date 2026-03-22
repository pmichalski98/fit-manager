# Implementation Tasks — VPS Migration & Performance Optimization

## Task 1: Next.js configuration for standalone output ✅

- [x] 1.1 Add `output: "standalone"` to `next.config.js`
- [x] 1.2 Install `sharp` as a production dependency (`npm install sharp`)
- [x] 1.3 Reduce Sentry `tracesSampleRate` from 1.0 to 0.2 in instrumentation config
- [x] 1.4 Verify `npm run build` succeeds and `.next/standalone` directory is created (79MB vs 928MB node_modules)

## Task 2: Docker setup ✅

- [x] 2.1 Create `Dockerfile` (multi-stage: deps → builder → runner) using the standalone output
- [x] 2.2 Create `.dockerignore` (exclude node_modules, .next, .git, .env\*)
- [x] 2.3 Create `docker-compose.yml` with `app` (port 3002) and `db` services — avoids port conflicts with existing apps
- [x] 2.4 Create `.env.production.example` with all required env vars documented
- [ ] 2.5 Test locally: `docker compose up --build` and verify app + DB work end-to-end

## Task 3: Database migration

- [ ] 3.1 Export production database from remote host using `pg_dump`
- [ ] 3.2 Import dump into local PostgreSQL container
- [ ] 3.3 Update `DATABASE_URL` to `postgresql://fitmanager:pass@db:5432/fitmanager`
- [ ] 3.4 Run `npx drizzle-kit push` to verify schema consistency
- [ ] 3.5 Spot-check data: compare row counts and verify key records match

## Task 4: CI/CD pipeline ✅

- [x] 4.1 Create `.github/workflows/deploy.yml` — GHCR-based (build in CI, pull on VPS), matches zawszeodbiera pattern
- [ ] 4.2 Add GitHub secrets: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `VPS_PORT`, `GH_PAT`, `DB_PASSWORD`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GITHUB_CLIENT_ID_OAUTH`, `GITHUB_CLIENT_SECRET_OAUTH`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `OPENAI_API_KEY`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET_NAME`, `SENTRY_AUTH_TOKEN`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_S3_BUCKET_URL`
- [ ] 4.3 Test deployment: push to main and verify it builds, pushes image, and deploys

## Task 5: Backup script

- [x] 5.1 Create `scripts/backup.sh` (pg_dump + gzip + 30-day retention)
- [ ] 5.2 Set up cron job on VPS: `0 3 * * *` to run backup daily
- [ ] 5.3 Verify backup produces a valid, restorable dump

## Task 6: VPS setup & Caddy

- [ ] 6.1 Add Caddy site block for fit-manager domain → `reverse_proxy localhost:3002`
- [ ] 6.2 Reload Caddy: `sudo systemctl reload caddy`
- [ ] 6.3 Point DNS to VPS IP (Cloudflare or direct)
- [ ] 6.4 Verify app is accessible via HTTPS on the domain
- [ ] 6.5 Update OAuth callback URLs (GitHub, Google) to point to the new domain

## Task 7: Smoke test & cutover

- [ ] 7.1 Test all routes: sign in, dashboard, training CRUD, session flow, body logs, photo upload
- [ ] 7.2 Verify HTTPS works end-to-end
- [ ] 7.3 Compare page load times (before vs after) using browser DevTools
- [ ] 7.4 Monitor Sentry for new errors over 24-48 hours
- [ ] 7.5 Keep Vercel deployment alive for 48 hours as fallback, then decommission

## Port Map (VPS)

| App                | Port     |
| ------------------ | -------- |
| zawszeodbiera web  | 3000     |
| personal-assistant | 3001     |
| **fit-manager**    | **3002** |
| zawszeodbiera api  | 4000     |
| zawszeodbiera pg   | 5432     |
| Caddy              | 80, 443  |
