import path from "node:path";
import { fileURLToPath } from "node:url";
import { migrate } from "../../../app/platform/database/db.js";
import { migrations } from "./migrations.js";
import { createContactRepository } from "./repository.js";
import { createContactRouter } from "./routes.js";
import { createContactDirectory } from "../contracts/contact-directory.js";

const frontendDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../frontend"
);

/**
 * @param db SQLite database handle
 * @param deps.companyDirectory CompanyDirectory contract implementation
 */
export function createContactsFeature(db, { companyDirectory }) {
  migrate(db, migrations);
  const repository = createContactRepository(db);
  return {
    name: "contacts",
    router: createContactRouter(repository, companyDirectory),
    frontendDir,
    // Public contract for other features (e.g. deals).
    contactDirectory: createContactDirectory(repository),
  };
}
