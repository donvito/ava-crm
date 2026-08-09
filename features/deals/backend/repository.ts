import type { SqliteDb } from "../../../app/platform/database/db";
import type { DealInput, Stage } from "./validation";

export interface Deal extends DealInput {
  id: number;
  created_at: string;
}

export class DealRepository {
  constructor(private readonly db: SqliteDb) {}

  list({ stage }: { stage?: Stage } = {}): Deal[] {
    if (stage)
      return this.db
        .prepare("SELECT * FROM deals WHERE stage = ? ORDER BY created_at DESC, id DESC")
        .all(stage) as Deal[];
    return this.db
      .prepare("SELECT * FROM deals ORDER BY created_at DESC, id DESC")
      .all() as Deal[];
  }

  get(id: number): Deal | undefined {
    return this.db.prepare("SELECT * FROM deals WHERE id = ?").get(id) as
      | Deal
      | undefined;
  }

  create(input: DealInput): Deal {
    const result = this.db
      .prepare(
        "INSERT INTO deals (title, value_cents, stage, contact_id, company_id) VALUES (?, ?, ?, ?, ?)"
      )
      .run(input.title, input.value_cents, input.stage, input.contact_id, input.company_id);
    return this.get(Number(result.lastInsertRowid))!;
  }

  setStage(id: number, stage: Stage): Deal | undefined {
    const result = this.db
      .prepare("UPDATE deals SET stage = ? WHERE id = ?")
      .run(stage, id);
    return result.changes > 0 ? this.get(id) : undefined;
  }

  remove(id: number): boolean {
    return this.db.prepare("DELETE FROM deals WHERE id = ?").run(id).changes > 0;
  }
}
