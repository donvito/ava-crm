export function createCompanyRepository(db) {
  return {
    list() {
      return db
        .prepare("SELECT * FROM companies ORDER BY name COLLATE NOCASE")
        .all();
    },
    get(id) {
      return db.prepare("SELECT * FROM companies WHERE id = ?").get(id);
    },
    create({ name, industry, website }) {
      const result = db
        .prepare(
          "INSERT INTO companies (name, industry, website) VALUES (?, ?, ?)"
        )
        .run(name, industry, website);
      return this.get(result.lastInsertRowid);
    },
    update(id, { name, industry, website }) {
      const result = db
        .prepare(
          "UPDATE companies SET name = ?, industry = ?, website = ? WHERE id = ?"
        )
        .run(name, industry, website, id);
      return result.changes > 0 ? this.get(id) : undefined;
    },
    remove(id) {
      return db.prepare("DELETE FROM companies WHERE id = ?").run(id).changes > 0;
    },
  };
}
