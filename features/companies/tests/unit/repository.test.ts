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
  createCompany,
  deleteCompany,
  listCompanies,
  updateCompany,
} from "../../backend/repository";

describe("companies repository", () => {
  let dbPath: string;

  beforeEach(() => {
    dbPath = path.join(
      os.tmpdir(),
      `ava-crm-companies-${Date.now()}-${Math.random()}.sqlite`,
    );
    process.env.CRM_DB_PATH = dbPath;
    resetDb(dbPath);
  });

  afterEach(() => {
    closeDb();
    if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
  });

  it("creates and lists companies", () => {
    const db = getDb();
    createCompany(db, {
      name: "Orbit Labs",
      industry: "Software",
      website: "https://orbit.example",
    });

    const companies = listCompanies(db);
    expect(companies).toHaveLength(1);
    expect(companies[0]?.name).toBe("Orbit Labs");
    expect(companies[0]?.contactCount).toBe(0);
  });

  it("updates and deletes a company", () => {
    const db = getDb();
    const created = createCompany(db, { name: "Temp Co" });
    const updated = updateCompany(db, created.id, {
      name: "Temp Co Renamed",
      industry: "Logistics",
    });
    expect(updated?.name).toBe("Temp Co Renamed");
    expect(updated?.industry).toBe("Logistics");

    expect(deleteCompany(db, created.id)).toBe(true);
    expect(listCompanies(db)).toHaveLength(0);
  });
});
