# Fit Manager

A self-hosted fitness tracking app I built for my own daily use — strength training, nutrition, body measurements and progress analytics in one place, installable as a PWA on mobile.

<!-- TODO: add a screenshot or short demo GIF here -->

## Features

- **Live workout sessions** — training templates with target sets/rep ranges, per-set logging with autosave and resume, rest timers, exercise notes, drag-and-drop reordering and ad-hoc exercise additions mid-session
- **Progress feedback while you lift** — each set is compared against the same set from your previous session via estimated 1RM (Brzycki), with PR detection against all-time records and a warmup set generator for heavy compound lifts
- **Dashboard analytics** — weight history, per-exercise strength progress, training volume, workout consistency heatmap, and calorie/macro history charts with configurable visibility and date ranges
- **Automatic nutrition sync** — daily meals, calories and macros pulled from Fitatu (unofficial API) on a cron schedule, with weekly AI-generated nutrition analysis (OpenAI)
- **Strava integration** — cardio activities imported automatically via webhook
- **Body tracking** — weight, body measurements, and progress photos (stored in S3)

## Tech stack

Next.js (App Router) · React 19 · TypeScript · Bun · Tailwind CSS 4 · shadcn/ui (Radix) · Drizzle ORM · PostgreSQL · better-auth (GitHub/Google OAuth) · Recharts · Sentry · Docker

Deployed on a VPS via Docker with a GitHub Actions → GHCR image pipeline; database migrations run automatically on container start.

## Running locally

Requires [Bun](https://bun.sh) and Docker (for the local database).

```bash
git clone git@github.com:pmichalski98/fit-manager.git
cd fit-manager
bun install

cp .env.example .env      # fill in the values — comments in the file explain each one
./start-database.sh       # starts a local Postgres container

bun run db:push           # sync schema to the database
bun run dev               # http://localhost:3000
```

The database URL, better-auth settings, GitHub/Google OAuth credentials and S3 keys are required; the Strava, Fitatu and OpenAI integrations are optional — without them the app runs and the related features just stay empty.

## Project structure

```
src/
├── app/           # Next.js App Router routes (auth, dashboard, training, nutrition, body, photo)
├── modules/       # feature modules: session, training, dashboard, nutrition, fitatu, strava, body, photo, auth
│   └── <module>/  # actions, repositories, schemas, lib, ui per module
└── server/db/     # Drizzle schema and client
```

## Status

Personal project under active development — I use it for every workout, so features get added and refined based on real training needs.
