export function createDealRepository(db) {
  return {
    list({ stage } = {}) {
      if (stage)
        return db
          .prepare("SELECT * FROM deals WHERE stage = ? ORDER BY created_at DESC, id DESC")
          .all(stage);
      return db
        .prepare("SELECT * FROM deals ORDER BY created_at DESC, id DESC")
        .all();
    },
    get(id) {
      return db.prepare("SELECT * FROM deals WHERE id = ?").get(id);
    },
    create({ title, value_cents, stage, contact_id, company_id }) {
      const result = db
        .prepare(
          "INSERT INTO deals (title, value_cents, stage, contact_id, company_id) VALUES (?, ?, ?, ?, ?)"
        )
        .run(title, value_cents, stage, contact_id, company_id);
      return this.get(result.lastInsertRowid);
    },
    setStage(id, stage) {
      const result = db
        .prepare("UPDATE deals SET stage = ? WHERE id = ?")
        .run(stage, id);
      return result.changes > 0 ? this.get(id) : undefined;
    },
    remove(id) {
      return db.prepare("DELETE FROM deals WHERE id = ?").run(id).changes > 0;
    },
  };
}
