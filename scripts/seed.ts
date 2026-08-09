// Seed demo data for local development: npm run seed
import { openDatabase, migrate } from "../app/platform/database/db";
import { migrations as companyMigrations } from "../features/companies/backend/migrations";
import { migrations as contactMigrations } from "../features/contacts/backend/migrations";
import { migrations as dealMigrations } from "../features/deals/backend/migrations";
import { CompanyRepository } from "../features/companies/backend/repository";
import { ContactRepository } from "../features/contacts/backend/repository";
import { DealRepository } from "../features/deals/backend/repository";

const db = openDatabase();
migrate(db, [...companyMigrations, ...contactMigrations, ...dealMigrations]);

const companies = new CompanyRepository(db);
const contacts = new ContactRepository(db);
const deals = new DealRepository(db);

const acme = companies.create({
  name: "Acme Corp",
  industry: "Manufacturing",
  website: "acme.example.com",
});
const globex = companies.create({
  name: "Globex",
  industry: "Energy",
  website: "globex.example.com",
});

const ada = contacts.create({
  first_name: "Ada",
  last_name: "Lovelace",
  email: "ada@acme.example.com",
  phone: "555-0100",
  company_id: acme.id,
});
const grace = contacts.create({
  first_name: "Grace",
  last_name: "Hopper",
  email: "grace@globex.example.com",
  phone: "555-0101",
  company_id: globex.id,
});

deals.create({
  title: "Acme annual contract",
  value_cents: 2500000,
  stage: "proposal",
  contact_id: ada.id,
  company_id: acme.id,
});
deals.create({
  title: "Globex pilot",
  value_cents: 750000,
  stage: "qualified",
  contact_id: grace.id,
  company_id: globex.id,
});
deals.create({
  title: "Globex expansion",
  value_cents: 12000000,
  stage: "lead",
  contact_id: grace.id,
  company_id: globex.id,
});

console.log("Seeded 2 companies, 2 contacts, 3 deals.");
