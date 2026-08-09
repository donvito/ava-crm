import type { Db } from "../../../app/platform/database/db";
import type { Company } from "../../companies/contracts/types";
import type { Contact } from "../../contacts/contracts/types";
import type { Deal, DealStage, PipelineSummary } from "../../deals/contracts/types";
import { DEAL_STAGES } from "../../deals/contracts/types";
import type { DashboardSummary } from "../contracts/types";

function count(db: Db, sql: string): number {
  return Number((db.prepare(sql).get() as { count: number | bigint }).count);
}

export function getDashboardSummary(db: Db): DashboardSummary {
  const pipelineRows = db
    .prepare(
      `
      SELECT stage, COUNT(*) AS count, COALESCE(SUM(value_cents), 0) AS total_cents
      FROM deals
      GROUP BY stage
    `,
    )
    .all() as Array<{
    stage: DealStage;
    count: number | bigint;
    total_cents: number | bigint;
  }>;

  const byStage = new Map(pipelineRows.map((row) => [row.stage, row]));
  const pipeline: PipelineSummary[] = DEAL_STAGES.map((stage) => {
    const row = byStage.get(stage);
    return {
      stage,
      count: row ? Number(row.count) : 0,
      totalCents: row ? Number(row.total_cents) : 0,
    };
  });

  const recentDeals = (
    db
      .prepare(
        `
      SELECT
        d.id, d.title, d.value_cents, d.stage, d.company_id, d.contact_id,
        d.expected_close, d.notes, d.created_at, d.updated_at,
        co.name AS company_name,
        CASE
          WHEN ct.id IS NULL THEN NULL
          ELSE trim(ct.first_name || ' ' || ct.last_name)
        END AS contact_name
      FROM deals d
      LEFT JOIN companies co ON co.id = d.company_id
      LEFT JOIN contacts ct ON ct.id = d.contact_id
      ORDER BY d.updated_at DESC
      LIMIT 5
    `,
      )
      .all() as Array<{
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
    }>
  ).map(
    (row): Deal => ({
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
    }),
  );

  const recentContacts = (
    db
      .prepare(
        `
      SELECT
        ct.id, ct.first_name, ct.last_name, ct.email, ct.phone, ct.title,
        ct.company_id, ct.notes, ct.created_at, ct.updated_at,
        co.name AS company_name
      FROM contacts ct
      LEFT JOIN companies co ON co.id = ct.company_id
      ORDER BY ct.updated_at DESC
      LIMIT 5
    `,
      )
      .all() as Array<{
      id: number;
      first_name: string;
      last_name: string;
      email: string;
      phone: string;
      title: string;
      company_id: number | null;
      company_name: string | null;
      notes: string;
      created_at: string;
      updated_at: string;
    }>
  ).map(
    (row): Contact => ({
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      phone: row.phone,
      title: row.title,
      companyId: row.company_id,
      companyName: row.company_name,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }),
  );

  const recentCompanies = (
    db
      .prepare(
        `
      SELECT id, name, industry, website, notes, created_at, updated_at
      FROM companies
      ORDER BY updated_at DESC
      LIMIT 5
    `,
      )
      .all() as Array<{
      id: number;
      name: string;
      industry: string;
      website: string;
      notes: string;
      created_at: string;
      updated_at: string;
    }>
  ).map(
    (row): Company => ({
      id: row.id,
      name: row.name,
      industry: row.industry,
      website: row.website,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }),
  );

  return {
    companyCount: count(db, "SELECT COUNT(*) AS count FROM companies"),
    contactCount: count(db, "SELECT COUNT(*) AS count FROM contacts"),
    openDealCount: count(
      db,
      "SELECT COUNT(*) AS count FROM deals WHERE stage NOT IN ('won', 'lost')",
    ),
    pipelineValueCents: Number(
      (
        db
          .prepare(
            "SELECT COALESCE(SUM(value_cents), 0) AS total FROM deals WHERE stage NOT IN ('won', 'lost')",
          )
          .get() as { total: number | bigint }
      ).total,
    ),
    pipeline,
    recentDeals,
    recentContacts,
    recentCompanies,
  };
}
