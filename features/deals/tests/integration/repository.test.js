import { beforeEach, describe, expect, it } from "vitest";
import { openDatabase, migrate } from "../../../../app/platform/database/db.js";
import { migrations } from "../../backend/migrations.js";
import { createDealRepository } from "../../backend/repository.js";

const baseDeal = {
  title: "Website revamp",
  value_cents: 500000,
  stage: "lead",
  contact_id: null,
  company_id: null,
};

describe("deal repository", () => {
  let repository;

  beforeEach(() => {
    const db = openDatabase({ dbPath: ":memory:" });
    migrate(db, migrations);
    repository = createDealRepository(db);
  });

  it("creates a deal with defaults applied", () => {
    const deal = repository.create(baseDeal);
    expect(deal.title).toBe("Website revamp");
    expect(deal.value_cents).toBe(500000);
    expect(deal.stage).toBe("lead");
  });

  it("filters deals by stage", () => {
    repository.create(baseDeal);
    repository.create({ ...baseDeal, title: "Won deal", stage: "won" });
    expect(repository.list({ stage: "won" }).map((d) => d.title)).toEqual([
      "Won deal",
    ]);
    expect(repository.list()).toHaveLength(2);
  });

  it("moves a deal through stages", () => {
    const deal = repository.create(baseDeal);
    expect(repository.setStage(deal.id, "qualified").stage).toBe("qualified");
    expect(repository.setStage(deal.id, "won").stage).toBe("won");
    expect(repository.setStage(9999, "won")).toBeUndefined();
  });

  it("rejects invalid stages at the database level", () => {
    expect(() =>
      repository.create({ ...baseDeal, stage: "bogus" })
    ).toThrow(/CHECK constraint/);
  });

  it("removes a deal", () => {
    const deal = repository.create(baseDeal);
    expect(repository.remove(deal.id)).toBe(true);
    expect(repository.list()).toHaveLength(0);
  });
});
