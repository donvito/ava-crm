import type { SqliteDb } from "../../../app/platform/database/db";
import type { CompanyInput } from "./validation";

export interface Company extends CompanyInput {
  id: number;
  created_at: string;
}

export class CompanyRepository {
  constructor(private readonly db: SqliteDb) {}

  list(): Company[] {
    return this.db
      .prepare("SELECT * FROM companies ORDER BY name COLLATE NOCASE")
      .all() as Company[];
  }

  get(id: number): Company | undefined {
    return this.db.prepare("SELECT * FROM companies WHERE id = ?").get(id) as
      | Company
      | undefined;
  }

  create({ name, industry, website }: CompanyInput): Company {
    const result = this.db
      .prepare("INSERT INTO companies (name, industry, website) VALUES (?, ?, ?)")
      .run(name, industry, website);
    return this.get(Number(result.lastInsertRowid))!;
  }

  update(id: number, { name, industry, website }: CompanyInput): Company | undefined {
    const result = this.db
      .prepare("UPDATE companies SET name = ?, industry = ?, website = ? WHERE id = ?")
      .run(name, industry, website, id);
    return result.changes > 0 ? this.get(id) : undefined;
  }

  remove(id: number): boolean {
    return this.db.prepare("DELETE FROM companies WHERE id = ?").run(id).changes > 0;
  }
}
