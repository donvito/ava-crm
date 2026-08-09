import { Module } from "@nestjs/common";
import type { DynamicModule } from "@nestjs/common";
import type { SqliteDb } from "../../../app/platform/database/db";
import { migrate } from "../../../app/platform/database/db";
import { DATABASE } from "../../../app/platform/database/database.module";
import { COMPANY_DIRECTORY } from "../../companies/contracts/company-directory";
import { CompaniesModule } from "../../companies/backend/companies.module";
import { CONTACT_DIRECTORY } from "../contracts/contact-directory";
import type { ContactDirectory } from "../contracts/contact-directory";
import { createFakeCompanyDirectory } from "../fixtures/fake-company-directory";
import { migrations } from "./migrations";
import { ContactRepository } from "./repository";
import { ContactsController, CONTACT_REPOSITORY } from "./contacts.controller";

const repositoryProvider = {
  provide: CONTACT_REPOSITORY,
  inject: [DATABASE],
  useFactory: (db: SqliteDb) => {
    migrate(db, migrations);
    return new ContactRepository(db);
  },
};

/** Real ContactDirectory contract implementation. */
export function createContactDirectory(
  repository: ContactRepository
): ContactDirectory {
  return {
    listOptions: () =>
      repository
        .list()
        .map((c) => ({ id: c.id, name: `${c.first_name} ${c.last_name}` })),
    getName: (id) => {
      const contact = repository.get(id);
      return contact ? `${contact.first_name} ${contact.last_name}` : undefined;
    },
  };
}

const directoryProvider = {
  provide: CONTACT_DIRECTORY,
  inject: [CONTACT_REPOSITORY],
  useFactory: createContactDirectory,
};

@Module({})
export class ContactsModule {
  /**
   * When the companies feature is enabled, the real CompanyDirectory is used;
   * in the contacts sandbox the deterministic fake takes its place.
   */
  static register({ withCompanies }: { withCompanies: boolean }): DynamicModule {
    return {
      module: ContactsModule,
      imports: withCompanies ? [CompaniesModule] : [],
      controllers: [ContactsController],
      providers: withCompanies
        ? [repositoryProvider, directoryProvider]
        : [
            repositoryProvider,
            directoryProvider,
            { provide: COMPANY_DIRECTORY, useValue: createFakeCompanyDirectory() },
          ],
      exports: [CONTACT_DIRECTORY],
    };
  }
}
