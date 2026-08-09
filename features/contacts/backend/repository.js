export function createContactRepository(db) {
  return {
    list() {
      return db
        .prepare(
          "SELECT * FROM contacts ORDER BY last_name COLLATE NOCASE, first_name COLLATE NOCASE"
        )
        .all();
    },
    get(id) {
      return db.prepare("SELECT * FROM contacts WHERE id = ?").get(id);
    },
    create({ first_name, last_name, email, phone, company_id }) {
      const result = db
        .prepare(
          "INSERT INTO contacts (first_name, last_name, email, phone, company_id) VALUES (?, ?, ?, ?, ?)"
        )
        .run(first_name, last_name, email, phone, company_id);
      return this.get(result.lastInsertRowid);
    },
    update(id, { first_name, last_name, email, phone, company_id }) {
      const result = db
        .prepare(
          "UPDATE contacts SET first_name = ?, last_name = ?, email = ?, phone = ?, company_id = ? WHERE id = ?"
        )
        .run(first_name, last_name, email, phone, company_id, id);
      return result.changes > 0 ? this.get(id) : undefined;
    },
    remove(id) {
      return db.prepare("DELETE FROM contacts WHERE id = ?").run(id).changes > 0;
    },
  };
}
