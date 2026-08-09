import { beforeEach, describe, expect, it } from "vitest";
import { openDatabase, migrate } from "../../../../app/platform/database/db";
import { migrations } from "../../backend/migrations";
import { CompanyRepository } from "../../backend/repository";
import { createCompanyDirectory } from "../../backend/companies.module";

describe("company repository", () => {
  let repository: CompanyRepository;

  beforeEach(() => {
    const db = openDatabase({ dbPath: ":memory:" });
    migrate(db, migrations);
    repository = new CompanyRepository(db);
  });

  it("creates and lists companies sorted by name", () => {
    repository.create({ name: "Zenith", industry: "", website: "" });
    repository.create({ name: "acme", industry: "SaaS", website: "acme.com" });
    const names = repository.list().map((c) => c.name);
    expect(names).toEqual(["acme", "Zenith"]);
  });

  it("updates a company", () => {
    const created = repository.create({ name: "Acme", industry: "", website: "" });
    const updated = repository.update(created.id, {
      name: "Acme Inc",
      industry: "Manufacturing",
      website: "acme.com",
    });
    expect(updated?.name).toBe("Acme Inc");
    expect(updated?.industry).toBe("Manufacturing");
  });

  it("removes a company and reports missing ids", () => {
    const created = repository.create({ name: "Acme", industry: "", website: "" });
    expect(repository.remove(created.id)).toBe(true);
    expect(repository.remove(created.id)).toBe(false);
    expect(repository.list()).toHaveLength(0);
  });

  it("exposes companies through the CompanyDirectory contract", () => {
    const created = repository.create({ name: "Acme", industry: "", website: "" });
    const directory = createCompanyDirectory(repository);
    expect(directory.listOptions()).toEqual([{ id: created.id, name: "Acme" }]);
    expect(directory.getName(created.id)).toBe("Acme");
    expect(directory.getName(9999)).toBeUndefined();
  });
});
