import path from "node:path";
import { fileURLToPath } from "node:url";
import { migrate } from "../../../app/platform/database/db.js";
import { migrations } from "./migrations.js";
import { createCompanyRepository } from "./repository.js";
import { createCompanyRouter } from "./routes.js";
import { createCompanyDirectory } from "../contracts/company-directory.js";

const frontendDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../frontend"
);

export function createCompaniesFeature(db) {
  migrate(db, migrations);
  const repository = createCompanyRepository(db);
  return {
    name: "companies",
    router: createCompanyRouter(repository),
    frontendDir,
    // Public contract for other features (e.g. contacts, deals).
    companyDirectory: createCompanyDirectory(repository),
  };
}
