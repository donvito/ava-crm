export const migrations = [
  {
    id: "deals-001-create-table",
    sql: `
      CREATE TABLE deals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        value_cents INTEGER NOT NULL DEFAULT 0,
        stage TEXT NOT NULL DEFAULT 'lead'
          CHECK (stage IN ('lead', 'qualified', 'proposal', 'won', 'lost')),
        contact_id INTEGER,
        company_id INTEGER,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `,
  },
];
