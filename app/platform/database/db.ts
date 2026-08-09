import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export type Db = DatabaseSync;

let dbInstance: DatabaseSync | null = null;

export function getDatabasePath(): string {
  if (process.env.CRM_DB_PATH) {
    return process.env.CRM_DB_PATH;
  }
  return path.resolve(process.cwd(), "data", "crm.sqlite");
}

export function openDatabase(dbPath = getDatabasePath()): DatabaseSync {
  const dir = path.dirname(dbPath);
  fs.mkdirSync(dir, { recursive: true });

  const db = new DatabaseSync(dbPath);
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec("PRAGMA journal_mode = WAL;");
  return db;
}

export function migrate(db: DatabaseSync): void {
  const schemaPath = path.join(__dirname, "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf8");
  db.exec(schema);
}

export function getDb(): DatabaseSync {
  if (!dbInstance) {
    dbInstance = openDatabase();
    migrate(dbInstance);
  }
  return dbInstance;
}

export function resetDb(dbPath = getDatabasePath()): DatabaseSync {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }
  const wal = `${dbPath}-wal`;
  const shm = `${dbPath}-shm`;
  if (fs.existsSync(wal)) fs.unlinkSync(wal);
  if (fs.existsSync(shm)) fs.unlinkSync(shm);
  dbInstance = openDatabase(dbPath);
  migrate(dbInstance);
  return dbInstance;
}

export function closeDb(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
