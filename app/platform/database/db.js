import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

/**
 * Open (and optionally reset) the SQLite database.
 * DB_PATH controls the file location; use ":memory:" for tests.
 */
export function openDatabase({
  dbPath = process.env.DB_PATH ?? "data/crm.db",
  reset = process.env.DB_RESET === "1",
} = {}) {
  if (dbPath !== ":memory:") {
    if (reset && fs.existsSync(dbPath)) {
      fs.rmSync(dbPath);
      for (const suffix of ["-wal", "-shm"]) {
        const sidecar = dbPath + suffix;
        if (fs.existsSync(sidecar)) fs.rmSync(sidecar);
      }
    }
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  return db;
}

/**
 * Apply feature-owned migrations exactly once, in order.
 * Each migration: { id: string, sql: string }
 */
export function migrate(db, migrations) {
  db.exec(
    "CREATE TABLE IF NOT EXISTS schema_migrations (id TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT (datetime('now')))"
  );
  const isApplied = db.prepare("SELECT 1 FROM schema_migrations WHERE id = ?");
  const record = db.prepare("INSERT INTO schema_migrations (id) VALUES (?)");
  for (const migration of migrations) {
    if (isApplied.get(migration.id)) continue;
    db.transaction(() => {
      db.exec(migration.sql);
      record.run(migration.id);
    })();
  }
}
