# AVA CRM

A small CRM built with a **Next.js** frontend, a **NestJS** backend, and a **SQLite** database (better-sqlite3), organized with [Agent-Verifiable Architecture (AVA)](AGENTS.md): each feature is a bounded, independently runnable, independently verifiable slice.

## Features

| Feature | Routes | What it does |
| --- | --- | --- |
| `companies` | `/companies` | Create, list, and delete companies |
| `contacts` | `/contacts` | Create, edit, and delete contacts; link them to companies |
| `deals` | `/deals` | Pipeline of deals (lead → qualified → proposal → won/lost) linked to contacts and companies, with stage filtering |

Cross-feature access happens only through explicit contracts, provided as NestJS injection tokens:

- `features/companies/contracts/company-directory.ts` — `CompanyDirectory` / `COMPANY_DIRECTORY` (used by contacts and deals)
- `features/contacts/contracts/contact-directory.ts` — `ContactDirectory` / `CONTACT_DIRECTORY` (used by deals)

When a feature runs in isolation, missing dependencies are replaced by deterministic fakes from that feature's `fixtures/` directory.

## Architecture

- **`apps/api`** — NestJS composition root. `AppModule.register()` assembles only the feature modules named in `FEATURES` and binds fake adapters for anything missing. Listens on port 3001.
- **`apps/web`** — Next.js (App Router). Thin route files under `apps/web/app/*` render the real page components owned by each feature (`features/*/frontend/*.tsx`). `/api/*` is proxied to the NestJS server at runtime via a route handler (`API_URL` env). Listens on port 3000.
- **`app/platform/database`** — SQLite connection + per-feature migration runner, exposed to Nest through the `DATABASE` token.
- **`features/<name>/backend`** — NestJS module, controller, repository, validation, and migrations for that slice.

## Getting started

```bash
npm install
npm run seed   # optional demo data
npm run dev    # NestJS API on :3001 + Next.js frontend on :3000
```

The SQLite database lives at `data/crm.db` by default (`DB_PATH` overrides it, `DB_RESET=1` recreates it on boot).

## Feature sandboxes

Run a single feature with fake adapters for its dependencies:

```bash
scripts/feature-dev deals      # deals only, fake contact/company directories
scripts/feature-dev contacts   # contacts only, fake company directory
```

## Testing

```bash
npm run test:unit              # Vitest unit + integration tests (in-memory SQLite)
scripts/feature-test contacts  # one feature's Playwright suite in its sandbox
npm run test:e2e               # all Playwright specs against the full app
npm run test:e2e:all           # every feature sandbox suite + cross-feature journey
```

Playwright starts its own servers (web on 4123, API on 4124) with a throwaway database in `.tmp/`, so tests never touch your dev data. Set `PW_VIDEO=1` to record a video of every test into `test-results/`.

## Layout

```text
apps/
  api/                 NestJS bootstrap (main.ts, dynamic AppModule)
  web/                 Next.js app (thin routes + runtime API proxy)
app/
  platform/database/   SQLite connection + migration runner (DATABASE token)
  ui/                  Shared stylesheet and Nav component
features/
  companies/           backend, frontend, contracts, tests, feature.yaml
  contacts/            backend, frontend, contracts, fixtures, tests, feature.yaml
  deals/               backend, frontend, fixtures, tests, feature.yaml
journeys/e2e/          Cross-feature user journey specs
scripts/               feature-dev, feature-test, start-web, seed.ts
```
