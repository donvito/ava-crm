import { afterEach, beforeEach, describe, expect, it } from "vitest";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";
import {
  closeDb,
  getDb,
  resetDb,
} from "../../../../app/platform/database/db.ts";
import {
  createDeal,
  getPipelineSummary,
  updateDeal,
} from "../../backend/repository.ts";

describe("deals repository", () => {
  let dbPath: string;

  beforeEach(() => {
    dbPath = path.join(
      os.tmpdir(),
      `ava-crm-deals-${Date.now()}-${Math.random()}.sqlite`,
    );
    process.env.CRM_DB_PATH = dbPath;
    resetDb(dbPath);
  });

  afterEach(() => {
    closeDb();
    if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
  });

  it("tracks pipeline totals by stage", () => {
    const db = getDb();
    const deal = createDeal(db, {
      title: "Pilot",
      valueCents: 100000,
      stage: "lead",
    });
    updateDeal(db, deal.id, {
      title: "Pilot",
      valueCents: 100000,
      stage: "proposal",
    });

    const summary = getPipelineSummary(db);
    const proposal = summary.find((row) => row.stage === "proposal");
    const lead = summary.find((row) => row.stage === "lead");
    expect(proposal?.count).toBe(1);
    expect(proposal?.totalCents).toBe(100000);
    expect(lead?.count).toBe(0);
  });
});
