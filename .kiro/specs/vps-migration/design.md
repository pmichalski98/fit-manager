# Design: VPS Migration & Performance Optimization

## Overview

Migrate fit-manager from Vercel's serverless infrastructure to a self-hosted VPS to eliminate cold start latency and reduce load times from 2-3 seconds to sub-second for a single-user application.

### Problem Analysis

The current 2-3 second production load time stems from Vercel's serverless execution model clashing with this app's architecture:

1. **Cold starts** — Vercel spins up new serverless function instances after idle periods. Each cold start re-initializes the Node.js runtime, loads all dependencies, and establishes a new database connection.
2. **No connection pooling** — Every cold start creates a fresh PostgreSQL connection to a remote database. TCP handshake + TLS + auth adds 100-300ms per cold start.
3. **Auth on every request** — The `(protected)/layout.tsx` calls `auth.api.getSession()` which hits the database. On a cold start, this is the first query on a brand-new connection.
4. **Sentry at 100% trace sampling** — Every request is traced, adding overhead to both server and client.
5. **No static generation** — All routes are SSR with zero ISR/SSG, meaning every page visit triggers serverless execution.
6. **Heavy bundle** — Recharts (~200KB), AWS SDK (~150KB), Sentry (~100KB), and 20+ Radix packages all contribute to slow function initialization.

### Why VPS

For a single-user app, a persistent Node.js process on a VPS:

- Eliminates cold starts entirely (process is always warm)
- Maintains persistent database connections (no per-request connection setup)
- Can run PostgreSQL locally (zero network latency for DB queries)
- Gives full control over caching, compression, and process management
- Costs the same or less than Vercel Pro for a single app

## Architecture

### Current (Vercel)

```
User → Vercel CDN → Serverless Function (cold start risk)
                         ↓
                   Remote PostgreSQL
                         ↓
                   AWS S3 (eu-central-1)
```

### Target (VPS)

```
User → Cloudflare (DNS) → Caddy on VPS (reverse proxy + SSL)
         ↓
       VPS: Docker Next.js (standalone, always-warm, port 3002)
         ↓
       VPS: Docker PostgreSQL (local, same machine)
         ↓
       AWS S3 (eu-central-1, unchanged)

Note: Caddy is already running on the VPS (serves zawszeodbiera on :3000 and :4000,
personal-assistant on :3001). fit-manager uses port 3002 to avoid conflicts.
```

### Infrastructure Stack

| Layer             | Technology              | Rationale                                                    |
| ----------------- | ----------------------- | ------------------------------------------------------------ |
| Reverse proxy     | Caddy (existing on VPS) | Already running for other apps, handles SSL + routing to port 3002 |
| App runtime       | Docker (standalone)     | Isolated, reproducible, ~150MB image vs ~1GB with node_modules |
| Database          | PostgreSQL 16 (Docker)  | Local = zero network latency, persistent volume for data     |
| Orchestration     | Docker Compose          | Single `docker compose up -d` to run everything              |
| Process management| Docker restart policy   | `unless-stopped` handles crashes, no PM2 needed              |
| CI/CD             | GitHub Actions + GHCR   | Build image in CI, push to GHCR, pull on VPS (matches existing apps) |
| Backups           | pg_dump cron + offsite  | Daily DB dumps synced to S3 or Backblaze B2                  |

## Components and Interfaces

### 1. Next.js Configuration Changes

**`next.config.js`** — Enable standalone output:

```js
output: "standalone"
```

This makes Next.js produce a self-contained `.next/standalone` directory with only the runtime dependencies needed. The Docker image copies this instead of the full `node_modules` (928MB → ~150MB).

### 2. Dockerfile (multi-stage)

```dockerfile
FROM node:20-alpine AS base

# --- Install dependencies ---
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# --- Build application ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build args for env vars needed at build time
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_S3_BUCKET_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_S3_BUCKET_URL=$NEXT_PUBLIC_S3_BUCKET_URL
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# --- Production image ---
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
```

### 3. Docker Compose

```yaml
services:
  app:
    image: ghcr.io/<your-repo>/fit-manager:latest
    container_name: fit-manager-app
    restart: unless-stopped
    env_file: .env.app
    ports:
      - "3002:3000"
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:16-alpine
    container_name: fit-manager-postgres
    restart: unless-stopped
    env_file: .env.db
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U fitmanager -d fitmanager"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
```

Key decisions:
- App on port **3002** — avoids conflicts with zawszeodbiera (:3000, :4000) and personal-assistant (:3001)
- PostgreSQL port **not exposed** to host — only accessible within Docker network (zawszeodbiera already uses host port 5432)
- Pre-built images from GHCR — no building on VPS, matches existing deployment pattern
- Container names prefixed with `fit-manager-` to avoid collisions
- `.env.app` and `.env.db` generated by CI/CD from GitHub secrets

### 4. Caddy Configuration (existing VPS)

Add a new site block to the existing Caddyfile on the VPS:

```
fitmanager.yourdomain.com {
    reverse_proxy localhost:3002
}
```

Caddy already handles SSL via Let's Encrypt for the other apps. Adding this block auto-provisions a certificate for the fit-manager domain.

### 5. CI/CD Pipeline (GitHub Actions)

Matches the existing pattern from zawszeodbiera — build image in CI, push to GHCR, pull on VPS:

1. **Build job**: Checkout → login to GHCR → build Docker image → push with `latest` + SHA tags
2. **Deploy job**: SSH into VPS → generate env files from secrets → generate docker-compose.yml → pull image → start containers → health check

The deploy script dynamically generates `docker-compose.yml`, `.env.app`, and `.env.db` on the VPS from GitHub secrets, so no repo clone is needed on the server.

### 6. Database Backup Script

```bash
#!/bin/bash
# /opt/fit-manager/scripts/backup.sh
BACKUP_DIR=/opt/backups/fit-manager
TIMESTAMP=$(date +%Y%m%d_%H%M)

mkdir -p $BACKUP_DIR
docker compose -f /opt/fit-manager/docker-compose.yml exec -T db \
  pg_dump -U $POSTGRES_USER $POSTGRES_DB | gzip > "$BACKUP_DIR/db_$TIMESTAMP.sql.gz"

# Keep only last 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
```

Scheduled via cron: `0 3 * * * /opt/fit-manager/scripts/backup.sh`

## Data Models

No schema changes required. The migration is infrastructure-only.

**Database migration steps:**
1. Export current remote PostgreSQL data: `pg_dump` from remote host
2. Import into local PostgreSQL container: `psql < dump.sql`
3. Update `DATABASE_URL` in `.env.production` to point to the local container:
   ```
   DATABASE_URL=postgresql://appuser:secret@db:5432/fitmanager
   ```
4. Run Drizzle migrations to verify schema consistency: `npx drizzle-kit push`

## Performance Optimizations (alongside migration)

These are low-effort, high-impact changes to make during the migration:

### P0 — Do during migration

| Change | Impact | Effort |
|--------|--------|--------|
| `output: "standalone"` in next.config | Docker image 928MB → ~150MB, faster deploys | 1 line |
| Reduce Sentry trace sampling to 10-20% | Less overhead per request | 1 line |
| Local PostgreSQL (same machine) | Eliminates DB network latency (~50-200ms saved) | Part of migration |

### P1 — Quick wins post-migration

| Change | Impact | Effort |
|--------|--------|--------|
| Dynamic import Recharts | Smaller initial JS bundle on dashboard | ~30 min |
| Dynamic import heavy Radix components | Smaller bundle for routes that don't use them | ~1 hour |
| Add `sharp` dependency | Better image optimization in Next.js | `npm install sharp` |

### P2 — Nice to have

| Change | Impact | Effort |
|--------|--------|--------|
| ISR for dashboard (revalidate every 60s) | Cached pages for repeat visits | ~1 hour |
| Move auth check to middleware.ts | Faster auth on edge, fewer DB round trips | ~2 hours |

## Error Handling

### Deployment Failures
- Docker Compose `restart: unless-stopped` automatically restarts crashed containers
- GitHub Actions deployment logs are visible in the repo's Actions tab
- If the build fails, the old containers keep running (no downtime during failed deploys)

### Database Failures
- PostgreSQL health check prevents the app from starting before DB is ready
- Docker restarts the DB container on crash
- Daily backups enable point-in-time recovery

### SSL/Proxy Failures
- Caddy auto-renews Let's Encrypt certificates (already working for other apps on the VPS)
- If Caddy needs a restart: `sudo systemctl restart caddy`

### Rollback Strategy
- `git revert` + push triggers a new deploy with the previous code
- For database rollbacks: restore from the latest backup dump

## Testing Strategy

### Pre-Migration Testing
1. Build and run `docker compose up` locally to verify the full stack works
2. Run the existing app test suite (if any) against the Dockerized setup
3. Verify database migration by comparing row counts and spot-checking data

### Migration Day
1. Export production database from remote host
2. Set up VPS: install Docker, clone repo
3. Import database, start services
4. Test all routes manually:
   - Sign in (GitHub OAuth, Google OAuth)
   - Dashboard loads with charts
   - Create/edit/delete a training
   - Start and complete a training session
   - Log body measurements
   - Upload a progress photo
5. Add site block to Caddyfile on VPS for fit-manager domain → `reverse_proxy localhost:3002`
6. Reload Caddy: `sudo systemctl reload caddy`
7. Point DNS to VPS IP (Cloudflare or direct)
8. Verify HTTPS works
9. Keep Vercel deployment alive for 48 hours as fallback

### Post-Migration Monitoring
- Check Sentry for new errors in the first 24-48 hours
- Monitor VPS resource usage (`docker stats`, `htop`)
- Verify backup cron is running and producing valid dumps
- Compare page load times before/after using browser DevTools

## VPS Requirements

For a single-user Next.js + PostgreSQL app:

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU      | 1 vCPU  | 2 vCPU      |
| RAM      | 1 GB    | 2 GB        |
| Disk     | 20 GB   | 40 GB       |
| OS       | Ubuntu 22.04+ or Debian 12 | Same |

This fits comfortably in a $5-10/month VPS from most providers.
