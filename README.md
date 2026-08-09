# Ava CRM

Ava is a customer relationship manager built with Agent-Verifiable Architecture (AVA).

## Stack

- **Frontend:** Next.js (`apps/web`)
- **Backend:** NestJS (`apps/api`)
- **Database:** SQLite via Node's built-in `node:sqlite`
- **Tests:** Vitest + Playwright

## Features

| Feature | What it owns |
| --- | --- |
| `dashboard` | Home summary |
| `companies` | Company CRUD |
| `contacts` | Contact CRUD |
| `deals` | Pipeline deals and stage moves |

Each feature lives under `features/<name>/` with NestJS backend modules, Next.js UI pages, contracts, and tests.

## Quick start

```bash
npm install
npx playwright install chromium
npm run db:seed
npm run dev:all
```

- Web: [http://localhost:3000](http://localhost:3000)
- API: [http://localhost:3001/api/health](http://localhost:3001/api/health)

SQLite defaults to `data/crm.sqlite`.

## Scripts

```bash
npm run dev:all      # NestJS API + Next.js
npm run db:migrate   # apply schema
npm run db:seed      # load demo data
npm run test:unit    # vitest
npm run test:e2e     # playwright
npm test             # unit + e2e
```

## Architecture

```text
apps/
  api/     NestJS bootstrap
  web/     Next.js app router shell
features/
  <feature>/
    backend/   Nest modules, services, repositories
    frontend/  React client pages
    contracts/
    tests/
app/platform/database/   SQLite access
```
