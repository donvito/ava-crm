#!/usr/bin/env tsx
import { spawn, type ChildProcess } from "node:child_process";
import path from "node:path";
import { resetDb, getDb, closeDb } from "../app/platform/database/db.ts";

const feature = process.argv[2] ?? "all";
const useTestDb = process.argv.includes("--test-db");

const children: ChildProcess[] = [];

function shutdown(code = 0) {
  for (const child of children) {
    child.kill("SIGTERM");
  }
  closeDb();
  process.exit(code);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

if (useTestDb) {
  process.env.CRM_DB_PATH = path.resolve(process.cwd(), "data", "crm-test.sqlite");
  resetDb(process.env.CRM_DB_PATH);
  // Seed a clean, deterministic fixture for E2E.
  const db = getDb();
  db.prepare(
    `INSERT INTO companies (name, industry, website, notes) VALUES (?, ?, ?, ?)`,
  ).run("Fixture Co", "Software", "https://fixture.example", "E2E company");
  const companyId = Number(
    (
      db.prepare("SELECT id FROM companies WHERE name = ?").get("Fixture Co") as {
        id: number;
      }
    ).id,
  );
  db.prepare(
    `INSERT INTO contacts (first_name, last_name, email, phone, title, company_id, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    "Casey",
    "Rivera",
    "casey@fixture.example",
    "+1-555-0000",
    "Founder",
    companyId,
    "",
  );
  db.prepare(
    `INSERT INTO deals (title, value_cents, stage, company_id, contact_id, expected_close, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run("Fixture deal", 250000, "lead", companyId, null, "2026-12-01", "");
  console.log(`Using test database at ${process.env.CRM_DB_PATH}`);
} else {
  getDb();
}

const api = spawn("tsx", ["app/server.ts"], {
  stdio: "inherit",
  env: { ...process.env, PORT: process.env.PORT ?? "3001" },
});
children.push(api);

const vite = spawn("npx", ["vite", "--host", "127.0.0.1", "--port", "5173"], {
  stdio: "inherit",
  env: process.env,
});
children.push(vite);

console.log(`Starting Ava CRM feature sandbox: ${feature}`);

api.on("exit", (code) => {
  if (code && code !== 0) shutdown(code);
});
vite.on("exit", (code) => {
  if (code && code !== 0) shutdown(code);
});
