import type { SqliteDb } from "../../../app/platform/database/db";
import type { ContactInput } from "./validation";

export interface Contact extends ContactInput {
  id: number;
  created_at: string;
}

export class ContactRepository {
  constructor(private readonly db: SqliteDb) {}

  list(): Contact[] {
    return this.db
      .prepare(
        "SELECT * FROM contacts ORDER BY last_name COLLATE NOCASE, first_name COLLATE NOCASE"
      )
      .all() as Contact[];
  }

  get(id: number): Contact | undefined {
    return this.db.prepare("SELECT * FROM contacts WHERE id = ?").get(id) as
      | Contact
      | undefined;
  }

  create(input: ContactInput): Contact {
    const result = this.db
      .prepare(
        "INSERT INTO contacts (first_name, last_name, email, phone, company_id) VALUES (?, ?, ?, ?, ?)"
      )
      .run(input.first_name, input.last_name, input.email, input.phone, input.company_id);
    return this.get(Number(result.lastInsertRowid))!;
  }

  update(id: number, input: ContactInput): Contact | undefined {
    const result = this.db
      .prepare(
        "UPDATE contacts SET first_name = ?, last_name = ?, email = ?, phone = ?, company_id = ? WHERE id = ?"
      )
      .run(input.first_name, input.last_name, input.email, input.phone, input.company_id, id);
    return result.changes > 0 ? this.get(id) : undefined;
  }

  remove(id: number): boolean {
    return this.db.prepare("DELETE FROM contacts WHERE id = ?").run(id).changes > 0;
  }
}
