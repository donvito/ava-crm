# Folio CRM

A focused CRM for contacts, follow-up work, and sales opportunities. The app
uses a React interface, an Express feature API, and a real SQLite database that
persists locally.

## Run it

```bash
npm install
npm run dev
```

Open [http://localhost:4173](http://localhost:4173).

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
  backend/       SQLite store and HTTP API
  frontend/      React user interface
  tests/         Integration and Playwright behavior tests
  feature.yaml   Ownership, dependencies, and verification manifest
```

The browser talks to the real feature API in acceptance tests. SQLite is the
only runtime dependency; tests replace the production database path with an
isolated in-memory or temporary SQLite database.
