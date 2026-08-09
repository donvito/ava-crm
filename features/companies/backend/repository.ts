import type { Db } from "../../../app/platform/database/db";
import type { Company, CompanyInput } from "../contracts/types";

type CompanyRow = {
  id: number;
  name: string;
  industry: string;
  website: string;
  notes: string;
  created_at: string;
  updated_at: string;
  contact_count?: number | bigint;
  deal_count?: number | bigint;
};

function mapCompany(row: CompanyRow): Company {
  return {
    id: row.id,
    name: row.name,
    industry: row.industry,
    website: row.website,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    contactCount:
      row.contact_count === undefined ? undefined : Number(row.contact_count),
    dealCount: row.deal_count === undefined ? undefined : Number(row.deal_count),
  };
}

export function listCompanies(db: Db): Company[] {
  const rows = db
    .prepare(
      `
      SELECT
        c.*,
        (SELECT COUNT(*) FROM contacts ct WHERE ct.company_id = c.id) AS contact_count,
        (SELECT COUNT(*) FROM deals d WHERE d.company_id = c.id) AS deal_count
      FROM companies c
      ORDER BY c.name COLLATE NOCASE ASC
    `,
    )
    .all() as CompanyRow[];
  return rows.map(mapCompany);
}

export function getCompany(db: Db, id: number): Company | null {
  const row = db
    .prepare(
      `
      SELECT
        c.*,
        (SELECT COUNT(*) FROM contacts ct WHERE ct.company_id = c.id) AS contact_count,
        (SELECT COUNT(*) FROM deals d WHERE d.company_id = c.id) AS deal_count
      FROM companies c
      WHERE c.id = ?
    `,
    )
    .get(id) as CompanyRow | undefined;
  return row ? mapCompany(row) : null;
}

export function createCompany(db: Db, input: CompanyInput): Company {
  const result = db
    .prepare(
      `
      INSERT INTO companies (name, industry, website, notes)
      VALUES (?, ?, ?, ?)
    `,
    )
    .run(
      input.name.trim(),
      input.industry?.trim() ?? "",
      input.website?.trim() ?? "",
      input.notes?.trim() ?? "",
    );
  const created = getCompany(db, Number(result.lastInsertRowid));
  if (!created) throw new Error("Failed to create company");
  return created;
}

export function updateCompany(
  db: Db,
  id: number,
  input: CompanyInput,
): Company | null {
  const existing = getCompany(db, id);
  if (!existing) return null;

  db.prepare(
    `
    UPDATE companies
    SET name = ?, industry = ?, website = ?, notes = ?, updated_at = datetime('now')
    WHERE id = ?
  `,
  ).run(
    input.name.trim(),
    input.industry?.trim() ?? "",
    input.website?.trim() ?? "",
    input.notes?.trim() ?? "",
    id,
  );

  return getCompany(db, id);
}

export function deleteCompany(db: Db, id: number): boolean {
  const result = db.prepare("DELETE FROM companies WHERE id = ?").run(id);
  return Number(result.changes) > 0;
}
