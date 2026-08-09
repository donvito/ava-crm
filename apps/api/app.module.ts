import { Controller, Get, Inject, Module } from "@nestjs/common";
import type { DynamicModule } from "@nestjs/common";
import { DatabaseModule } from "../../app/platform/database/database.module";
import { CompaniesModule } from "../../features/companies/backend/companies.module";
import { ContactsModule } from "../../features/contacts/backend/contacts.module";
import { DealsModule } from "../../features/deals/backend/deals.module";

export const ENABLED_FEATURES = "ENABLED_FEATURES";

@Controller("meta")
export class MetaController {
  constructor(@Inject(ENABLED_FEATURES) private readonly features: string[]) {}

  @Get("features")
  features_() {
    return { features: this.features };
  }
}

@Module({})
export class AppModule {
  /**
   * FEATURES controls which slices boot. Missing dependencies are replaced
   * with fake adapters so each feature runs in its own sandbox.
   */
  static register(enabled: Set<string>): DynamicModule {
    const imports: DynamicModule["imports"] = [DatabaseModule];
    const order = ["companies", "contacts", "deals"];
    const featureList = order.filter((name) => enabled.has(name));

    const withCompanies = enabled.has("companies");
    if (withCompanies) imports.push(CompaniesModule);

    const contactsModule = enabled.has("contacts")
      ? ContactsModule.register({ withCompanies })
      : null;
    if (contactsModule) imports.push(contactsModule);

    if (enabled.has("deals"))
      imports.push(DealsModule.register({ contactsModule, withCompanies }));

    return {
      module: AppModule,
      imports,
      controllers: [MetaController],
      providers: [{ provide: ENABLED_FEATURES, useValue: featureList }],
    };
  }
}
