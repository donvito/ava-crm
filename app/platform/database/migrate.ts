import { getDb, getDatabasePath, closeDb } from "./db.ts";

const db = getDb();
console.log(`Migrated SQLite database at ${getDatabasePath()}`);
closeDb();
