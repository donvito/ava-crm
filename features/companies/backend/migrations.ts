import type { Migration } from "../../../app/platform/database/db";

export const migrations: Migration[] = [
  {
    id: "companies-001-create-table",
    sql: `
      CREATE TABLE companies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        industry TEXT NOT NULL DEFAULT '',
        website TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `,
  },
];
