import path from "node:path";
import { fileURLToPath } from "node:url";
import { migrate } from "../../../app/platform/database/db.js";
import { migrations } from "./migrations.js";
import { createDealRepository } from "./repository.js";
import { createDealRouter } from "./routes.js";

const frontendDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../frontend"
);

/**
 * @param db SQLite database handle
 * @param deps.contactDirectory ContactDirectory contract implementation
 * @param deps.companyDirectory CompanyDirectory contract implementation
 */
export function createDealsFeature(db, { contactDirectory, companyDirectory }) {
  migrate(db, migrations);
  const repository = createDealRepository(db);
  return {
    name: "deals",
    router: createDealRouter(repository, { contactDirectory, companyDirectory }),
    frontendDir,
  };
}
