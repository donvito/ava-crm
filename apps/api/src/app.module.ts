import { Module } from "@nestjs/common";
import { DatabaseModule } from "./database/database.module";
import { CompaniesModule } from "@features/companies/backend/companies.module";
import { ContactsModule } from "@features/contacts/backend/contacts.module";
import { DealsModule } from "@features/deals/backend/deals.module";
import { DashboardModule } from "@features/dashboard/backend/dashboard.module";
import { HealthController } from "./health.controller";

@Module({
  imports: [
    DatabaseModule,
    CompaniesModule,
    ContactsModule,
    DealsModule,
    DashboardModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
