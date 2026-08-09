import { getDb, getDatabasePath, closeDb } from "./db";

getDb();
console.log(`Migrated SQLite database at ${getDatabasePath()}`);
closeDb();
