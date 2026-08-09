import { getDb, closeDb } from "./db.ts";

const db = getDb();

const companyCount = db
  .prepare("SELECT COUNT(*) AS count FROM companies")
  .get() as { count: number };

if (companyCount.count > 0) {
  console.log("Database already seeded, skipping.");
  closeDb();
  process.exit(0);
}

const insertCompany = db.prepare(`
  INSERT INTO companies (name, industry, website, notes)
  VALUES (?, ?, ?, ?)
`);

const acme = insertCompany.run(
  "Acme Robotics",
  "Manufacturing",
  "https://acme.example",
  "Strategic account in industrial automation.",
);
const northwind = insertCompany.run(
  "Northwind Analytics",
  "Software",
  "https://northwind.example",
  "Data platform prospect.",
);
const harbor = insertCompany.run(
  "Harbor Health",
  "Healthcare",
  "https://harbor.example",
  "Clinic network evaluating CRM rollout.",
);

const insertContact = db.prepare(`
  INSERT INTO contacts (first_name, last_name, email, phone, title, company_id, notes)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const ada = insertContact.run(
  "Ada",
  "Chen",
  "ada.chen@acme.example",
  "+1-555-0101",
  "VP Operations",
  acme.lastInsertRowid,
  "Primary champion.",
);
insertContact.run(
  "Marcus",
  "Cole",
  "marcus@northwind.example",
  "+1-555-0144",
  "Head of Growth",
  northwind.lastInsertRowid,
  "",
);
insertContact.run(
  "Priya",
  "Nair",
  "priya.nair@harbor.example",
  "+1-555-0199",
  "Director of IT",
  harbor.lastInsertRowid,
  "Prefers async updates.",
);

const insertDeal = db.prepare(`
  INSERT INTO deals (title, value_cents, stage, company_id, contact_id, expected_close, notes)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

insertDeal.run(
  "Acme plant rollout",
  4800000,
  "proposal",
  acme.lastInsertRowid,
  ada.lastInsertRowid,
  "2026-09-30",
  "Waiting on security review.",
);
insertDeal.run(
  "Northwind seats expansion",
  1200000,
  "qualified",
  northwind.lastInsertRowid,
  null,
  "2026-10-15",
  "",
);
insertDeal.run(
  "Harbor pilot",
  750000,
  "lead",
  harbor.lastInsertRowid,
  null,
  "2026-11-01",
  "Kickoff scheduled.",
);

console.log("Seeded demo CRM data.");
closeDb();
