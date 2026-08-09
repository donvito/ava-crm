import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

export type Db = DatabaseSync;

let dbInstance: DatabaseSync | null = null;

export function getWorkspaceRoot(): string {
  if (process.env.CRM_WORKSPACE_ROOT) {
    return process.env.CRM_WORKSPACE_ROOT;
  }

  let dir = process.cwd();
  for (let i = 0; i < 6; i++) {
    const schemaCandidate = path.join(
      dir,
      "app",
      "platform",
      "database",
      "schema.sql",
    );
    if (fs.existsSync(schemaCandidate)) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  return process.cwd();
}

export function getDatabasePath(): string {
  if (process.env.CRM_DB_PATH) {
    return process.env.CRM_DB_PATH;
  }
  return path.resolve(getWorkspaceRoot(), "data", "crm.sqlite");
}

export function getSchemaPath(): string {
  if (process.env.CRM_SCHEMA_PATH) {
    return process.env.CRM_SCHEMA_PATH;
  }
  return path.resolve(
    getWorkspaceRoot(),
    "app",
    "platform",
    "database",
    "schema.sql",
  );
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
  const schemaPath = getSchemaPath();
  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Could not find schema.sql at ${schemaPath}`);
  }
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
