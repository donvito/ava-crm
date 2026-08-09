import type { Db } from "../../../app/platform/database/db.ts";
import type {
  Deal,
  DealInput,
  DealStage,
  PipelineSummary,
} from "../contracts/types.ts";
import { DEAL_STAGES } from "../contracts/types.ts";

type DealRow = {
  id: number;
  title: string;
  value_cents: number | bigint;
  stage: DealStage;
  company_id: number | null;
  company_name: string | null;
  contact_id: number | null;
  contact_name: string | null;
  expected_close: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
};

function mapDeal(row: DealRow): Deal {
  return {
    id: row.id,
    title: row.title,
    valueCents: Number(row.value_cents),
    stage: row.stage,
    companyId: row.company_id,
    companyName: row.company_name,
    contactId: row.contact_id,
    contactName: row.contact_name,
    expectedClose: row.expected_close,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const dealSelect = `
  SELECT
    d.*,
    co.name AS company_name,
    CASE
      WHEN ct.id IS NULL THEN NULL
      ELSE trim(ct.first_name || ' ' || ct.last_name)
    END AS contact_name
  FROM deals d
  LEFT JOIN companies co ON co.id = d.company_id
  LEFT JOIN contacts ct ON ct.id = d.contact_id
`;

export function listDeals(db: Db, stage?: DealStage): Deal[] {
  if (stage) {
    const rows = db
      .prepare(`${dealSelect} WHERE d.stage = ? ORDER BY d.updated_at DESC`)
      .all(stage) as DealRow[];
    return rows.map(mapDeal);
  }
  const rows = db
    .prepare(`${dealSelect} ORDER BY d.updated_at DESC`)
    .all() as DealRow[];
  return rows.map(mapDeal);
}

export function getDeal(db: Db, id: number): Deal | null {
  const row = db
    .prepare(`${dealSelect} WHERE d.id = ?`)
    .get(id) as DealRow | undefined;
  return row ? mapDeal(row) : null;
}

export function createDeal(db: Db, input: DealInput): Deal {
  const stage = input.stage ?? "lead";
  const result = db
    .prepare(
      `
      INSERT INTO deals (title, value_cents, stage, company_id, contact_id, expected_close, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    )
    .run(
      input.title.trim(),
      input.valueCents ?? 0,
      stage,
      input.companyId ?? null,
      input.contactId ?? null,
      input.expectedClose || null,
      input.notes?.trim() ?? "",
    );
  const created = getDeal(db, Number(result.lastInsertRowid));
  if (!created) throw new Error("Failed to create deal");
  return created;
}

export function updateDeal(db: Db, id: number, input: DealInput): Deal | null {
  const existing = getDeal(db, id);
  if (!existing) return null;

  db.prepare(
    `
    UPDATE deals
    SET title = ?, value_cents = ?, stage = ?, company_id = ?, contact_id = ?,
        expected_close = ?, notes = ?, updated_at = datetime('now')
    WHERE id = ?
  `,
  ).run(
    input.title.trim(),
    input.valueCents ?? 0,
    input.stage ?? existing.stage,
    input.companyId ?? null,
    input.contactId ?? null,
    input.expectedClose || null,
    input.notes?.trim() ?? "",
    id,
  );

  return getDeal(db, id);
}

export function deleteDeal(db: Db, id: number): boolean {
  const result = db.prepare("DELETE FROM deals WHERE id = ?").run(id);
  return Number(result.changes) > 0;
}

export function getPipelineSummary(db: Db): PipelineSummary[] {
  const rows = db
    .prepare(
      `
      SELECT stage, COUNT(*) AS count, COALESCE(SUM(value_cents), 0) AS total_cents
      FROM deals
      GROUP BY stage
    `,
    )
    .all() as Array<{ stage: DealStage; count: number | bigint; total_cents: number | bigint }>;

  const byStage = new Map(rows.map((row) => [row.stage, row]));
  return DEAL_STAGES.map((stage) => {
    const row = byStage.get(stage);
    return {
      stage,
      count: row ? Number(row.count) : 0,
      totalCents: row ? Number(row.total_cents) : 0,
    };
  });
}
