import { afterEach, beforeEach, describe, expect, it } from "vitest";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";
import {
  closeDb,
  getDb,
  resetDb,
} from "../../../../app/platform/database/db";
import {
  createContact,
  listContacts,
} from "../../backend/repository";

describe("contacts repository", () => {
  let dbPath: string;

  beforeEach(() => {
    dbPath = path.join(
      os.tmpdir(),
      `ava-crm-contacts-${Date.now()}-${Math.random()}.sqlite`,
    );
    process.env.CRM_DB_PATH = dbPath;
    resetDb(dbPath);
  });

  afterEach(() => {
    closeDb();
    if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
  });

  it("links contacts to companies", () => {
    const db = getDb();
    const company = db
      .prepare(
        `INSERT INTO companies (name, industry, website, notes) VALUES (?, ?, ?, ?)`,
      )
      .run("Harbor Health", "Healthcare", "", "");
    createContact(db, {
      firstName: "Priya",
      lastName: "Nair",
      email: "priya@harbor.example",
      companyId: Number(company.lastInsertRowid),
    });

    const contacts = listContacts(db);
    expect(contacts).toHaveLength(1);
    expect(contacts[0]?.companyName).toBe("Harbor Health");
  });
});
