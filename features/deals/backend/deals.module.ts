import { Module } from "@nestjs/common";
import type { DynamicModule, Provider } from "@nestjs/common";
import type { SqliteDb } from "../../../app/platform/database/db";
import { migrate } from "../../../app/platform/database/db";
import { DATABASE } from "../../../app/platform/database/database.module";
import { COMPANY_DIRECTORY } from "../../companies/contracts/company-directory";
import { CompaniesModule } from "../../companies/backend/companies.module";
import { CONTACT_DIRECTORY } from "../../contacts/contracts/contact-directory";
import { ContactsModule } from "../../contacts/backend/contacts.module";
import {
  createFakeCompanyDirectory,
  createFakeContactDirectory,
} from "../fixtures/fake-directories";
import { migrations } from "./migrations";
import { DealRepository } from "./repository";
import { DealsController, DEAL_REPOSITORY } from "./deals.controller";

const repositoryProvider: Provider = {
  provide: DEAL_REPOSITORY,
  inject: [DATABASE],
  useFactory: (db: SqliteDb) => {
    migrate(db, migrations);
    return new DealRepository(db);
  },
};

@Module({})
export class DealsModule {
  /**
   * Real directory contracts come from the enabled features' modules;
   * in the deals sandbox, deterministic fakes take their place.
   */
  static register({
    contactsModule,
    withCompanies,
  }: {
    contactsModule: DynamicModule | null;
    withCompanies: boolean;
  }): DynamicModule {
    const imports: DynamicModule["imports"] = [];
    const providers: Provider[] = [repositoryProvider];

    if (contactsModule) imports.push(contactsModule);
    else
      providers.push({
        provide: CONTACT_DIRECTORY,
        useValue: createFakeContactDirectory(),
      });

    if (withCompanies) imports.push(CompaniesModule);
    else
      providers.push({
        provide: COMPANY_DIRECTORY,
        useValue: createFakeCompanyDirectory(),
      });

    return {
      module: DealsModule,
      imports,
      controllers: [DealsController],
      providers,
    };
  }
}
