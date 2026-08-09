import { openDatabase } from "./app/platform/database/db.js";
import { createApp } from "./app/platform/http/server.js";
import { createCompaniesFeature } from "./features/companies/backend/index.js";
import { createContactsFeature } from "./features/contacts/backend/index.js";
import { createDealsFeature } from "./features/deals/backend/index.js";
import { createFakeCompanyDirectory } from "./features/contacts/fixtures/fake-company-directory.js";
import {
  createFakeContactDirectory,
  createFakeCompanyDirectory as createFakeCompanyDirectoryForDeals,
} from "./features/deals/fixtures/fake-directories.js";

// FEATURES controls which slices boot. Missing dependencies are replaced
// with fake adapters so each feature runs in its own sandbox.
const enabled = new Set(
  (process.env.FEATURES ?? "companies,contacts,deals")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean)
);

const db = openDatabase();
const features = [];

const companies = enabled.has("companies") ? createCompaniesFeature(db) : null;
if (companies) features.push(companies);

if (enabled.has("contacts")) {
  features.push(
    createContactsFeature(db, {
      companyDirectory: companies?.companyDirectory ?? createFakeCompanyDirectory(),
    })
  );
}

if (enabled.has("deals")) {
  const contacts = features.find((f) => f.name === "contacts");
  features.push(
    createDealsFeature(db, {
      contactDirectory: contacts?.contactDirectory ?? createFakeContactDirectory(),
      companyDirectory:
        companies?.companyDirectory ?? createFakeCompanyDirectoryForDeals(),
    })
  );
}

const app = createApp({ features });
const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  console.log(
    `AVA CRM listening on http://localhost:${port} (features: ${[...enabled].join(", ")})`
  );
});
