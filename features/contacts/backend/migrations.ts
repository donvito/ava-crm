import type { Migration } from "../../../app/platform/database/db";

export const migrations: Migration[] = [
  {
    id: "contacts-001-create-table",
    sql: `
      CREATE TABLE contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL DEFAULT '',
        company_id INTEGER,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `,
  },
];
