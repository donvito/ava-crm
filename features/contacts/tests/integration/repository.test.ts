import { beforeEach, describe, expect, it } from "vitest";
import { openDatabase, migrate } from "../../../../app/platform/database/db";
import { migrations } from "../../backend/migrations";
import { ContactRepository } from "../../backend/repository";
import { createContactDirectory } from "../../backend/contacts.module";

const ada = {
  first_name: "Ada",
  last_name: "Lovelace",
  email: "ada@example.com",
  phone: "",
  company_id: null,
};

describe("contact repository", () => {
  let repository: ContactRepository;

  beforeEach(() => {
    const db = openDatabase({ dbPath: ":memory:" });
    migrate(db, migrations);
    repository = new ContactRepository(db);
  });

  it("creates and lists contacts sorted by last then first name", () => {
    repository.create({ ...ada, first_name: "Grace", last_name: "Hopper" });
    repository.create(ada);
    const names = repository.list().map((c) => `${c.first_name} ${c.last_name}`);
    expect(names).toEqual(["Grace Hopper", "Ada Lovelace"]);
  });

  it("updates a contact including its company link", () => {
    const created = repository.create(ada);
    const updated = repository.update(created.id, {
      ...ada,
      phone: "555-0100",
      company_id: 7,
    });
    expect(updated?.phone).toBe("555-0100");
    expect(updated?.company_id).toBe(7);
  });

  it("removes a contact", () => {
    const created = repository.create(ada);
    expect(repository.remove(created.id)).toBe(true);
    expect(repository.get(created.id)).toBeUndefined();
  });

  it("exposes contacts through the ContactDirectory contract", () => {
    const created = repository.create(ada);
    const directory = createContactDirectory(repository);
    expect(directory.listOptions()).toEqual([
      { id: created.id, name: "Ada Lovelace" },
    ]);
    expect(directory.getName(created.id)).toBe("Ada Lovelace");
    expect(directory.getName(9999)).toBeUndefined();
  });
});
