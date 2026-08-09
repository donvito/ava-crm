# Folio CRM

A focused CRM for contacts, follow-up work, and sales opportunities. The app
uses a Next.js frontend, a NestJS feature API, and a real SQLite database that
persists locally.

## Run it

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Next.js serves the browser
application and proxies `/api/*` to the NestJS service on port `4000`.

The default database is created at `data/crm.sqlite` and populated with a small
demo workspace on first run. To use a different file:

```bash
CRM_DB_PATH=/path/to/crm.sqlite npm run dev
```

## Verify it

```bash
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Or run the complete feature regression:

```bash
npm run test:feature
```

## Feature boundary

The CRM is an independently runnable AVA feature:

```text
features/crm/
  backend/       NestJS module, controllers, services, and SQLite store
  contracts/     Explicit frontend/backend data contracts
  frontend/      Next.js App Router user interface
  tests/         Integration and Playwright behavior tests
  feature.yaml   Ownership, dependencies, and verification manifest
```

The browser talks through Next.js to the real NestJS API in acceptance tests.
Tests replace the production database path with an isolated in-memory or
temporary SQLite database.
