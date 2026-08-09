# Ava CRM

Ava is a small customer relationship manager built with Agent-Verifiable Architecture (AVA).

It uses:

- React + Vite for the UI
- Hono for the API
- SQLite via Node's built-in `node:sqlite`
- Playwright for user-level verification

## Features

| Feature | What it owns |
| --- | --- |
| `dashboard` | Home summary + app shell |
| `companies` | Company CRUD |
| `contacts` | Contact CRUD |
| `deals` | Pipeline deals and stage moves |

Each feature lives under `features/<name>/` with backend, frontend, contracts, fixtures, and tests.

## Quick start

```bash
npm install
npx playwright install chromium
npm run db:seed
npm run dev:all
```

Open [http://localhost:5173](http://localhost:5173).

API health check: [http://localhost:3001/api/health](http://localhost:3001/api/health).

SQLite file defaults to `data/crm.sqlite`.

## Scripts

```bash
npm run dev:all      # start API + Vite
npm run db:migrate   # apply schema
npm run db:seed      # load demo data
npm run test:unit    # vitest
npm run test:e2e     # playwright
npm test             # unit + e2e
```

## Verify a feature

```bash
npm test -- companies
```

## Architecture notes

- Platform owns SQLite access under `app/platform/database`.
- Features own their routes, domain logic, UI pages, and acceptance tests.
- Dashboard is an explicit composition view over CRM data.
