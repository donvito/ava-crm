import type { Db } from "../../../app/platform/database/db.ts";
import type { Contact, ContactInput } from "../contracts/types.ts";

type ContactRow = {
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
};

function mapContact(row: ContactRow): Contact {
  return {
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
  };
}

const contactSelect = `
  SELECT
    ct.*,
    co.name AS company_name
  FROM contacts ct
  LEFT JOIN companies co ON co.id = ct.company_id
`;

export function listContacts(db: Db): Contact[] {
  const rows = db
    .prepare(`${contactSelect} ORDER BY ct.last_name COLLATE NOCASE, ct.first_name COLLATE NOCASE`)
    .all() as ContactRow[];
  return rows.map(mapContact);
}

export function getContact(db: Db, id: number): Contact | null {
  const row = db
    .prepare(`${contactSelect} WHERE ct.id = ?`)
    .get(id) as ContactRow | undefined;
  return row ? mapContact(row) : null;
}

export function createContact(db: Db, input: ContactInput): Contact {
  const result = db
    .prepare(
      `
      INSERT INTO contacts (first_name, last_name, email, phone, title, company_id, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    )
    .run(
      input.firstName.trim(),
      input.lastName.trim(),
      input.email?.trim() ?? "",
      input.phone?.trim() ?? "",
      input.title?.trim() ?? "",
      input.companyId ?? null,
      input.notes?.trim() ?? "",
    );
  const created = getContact(db, Number(result.lastInsertRowid));
  if (!created) throw new Error("Failed to create contact");
  return created;
}

export function updateContact(
  db: Db,
  id: number,
  input: ContactInput,
): Contact | null {
  const existing = getContact(db, id);
  if (!existing) return null;

  db.prepare(
    `
    UPDATE contacts
    SET first_name = ?, last_name = ?, email = ?, phone = ?, title = ?,
        company_id = ?, notes = ?, updated_at = datetime('now')
    WHERE id = ?
  `,
  ).run(
    input.firstName.trim(),
    input.lastName.trim(),
    input.email?.trim() ?? "",
    input.phone?.trim() ?? "",
    input.title?.trim() ?? "",
    input.companyId ?? null,
    input.notes?.trim() ?? "",
    id,
  );

  return getContact(db, id);
}

export function deleteContact(db: Db, id: number): boolean {
  const result = db.prepare("DELETE FROM contacts WHERE id = ?").run(id);
  return Number(result.changes) > 0;
}
