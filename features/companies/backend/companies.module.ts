import { Module } from "@nestjs/common";
import type { SqliteDb } from "../../../app/platform/database/db";
import { migrate } from "../../../app/platform/database/db";
import { DATABASE } from "../../../app/platform/database/database.module";
import { COMPANY_DIRECTORY } from "../contracts/company-directory";
import type { CompanyDirectory } from "../contracts/company-directory";
import { migrations } from "./migrations";
import { CompanyRepository } from "./repository";
import { CompaniesController, COMPANY_REPOSITORY } from "./companies.controller";

/** Real CompanyDirectory contract implementation. */
export function createCompanyDirectory(
  repository: CompanyRepository
): CompanyDirectory {
  return {
    listOptions: () => repository.list().map(({ id, name }) => ({ id, name })),
    getName: (id) => repository.get(id)?.name,
  };
}

@Module({
  controllers: [CompaniesController],
  providers: [
    {
      provide: COMPANY_REPOSITORY,
      inject: [DATABASE],
      useFactory: (db: SqliteDb) => {
        migrate(db, migrations);
        return new CompanyRepository(db);
      },
    },
    {
      provide: COMPANY_DIRECTORY,
      inject: [COMPANY_REPOSITORY],
      useFactory: createCompanyDirectory,
    },
  ],
  exports: [COMPANY_DIRECTORY],
})
export class CompaniesModule {}
