# AVA CRM

A small CRM built with **Express + SQLite** (better-sqlite3) and a dependency-free vanilla-JS frontend, organized with [Agent-Verifiable Architecture (AVA)](AGENTS.md): each feature is a bounded, independently runnable, independently verifiable slice.

## Features

| Feature | Routes | What it does |
| --- | --- | --- |
| `companies` | `/companies` | Create, list, and delete companies |
| `contacts` | `/contacts` | Create, edit, and delete contacts; link them to companies |
| `deals` | `/deals` | Pipeline of deals (lead → qualified → proposal → won/lost) linked to contacts and companies, with stage filtering |

Cross-feature access happens only through explicit contracts:

- `features/companies/contracts/company-directory.js` — `CompanyDirectory` (used by contacts and deals)
- `features/contacts/contracts/contact-directory.js` — `ContactDirectory` (used by deals)

When a feature runs in isolation, missing dependencies are replaced by deterministic fakes from that feature's `fixtures/` directory.

## Getting started

```bash
npm install
npm run seed   # optional demo data
npm run dev    # full app on http://localhost:3000
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

Playwright starts its own server on port 4123 with a throwaway database in `.tmp/`, so tests never touch your dev data.

## Layout

```text
app/
  platform/database/   SQLite connection + migration runner
  platform/http/       Express app assembly from feature slices
  ui/public/           Shared stylesheet and nav shell
features/
  companies/           backend, frontend, contracts, tests, feature.yaml
  contacts/            backend, frontend, contracts, fixtures, tests, feature.yaml
  deals/               backend, frontend, fixtures, tests, feature.yaml
journeys/e2e/          Cross-feature user journey specs
scripts/               feature-dev, feature-test, seed.js
server.js              Composition root (wires features + contracts)
```
