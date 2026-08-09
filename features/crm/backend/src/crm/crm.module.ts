import { Module } from "@nestjs/common";
import {
  CRM_DATABASE_OPTIONS,
  CrmStore,
} from "../database/crm-store.service";
import { CrmController } from "./crm.controller";
import { CrmService } from "./crm.service";

@Module({
  controllers: [CrmController],
  providers: [
    {
      provide: CRM_DATABASE_OPTIONS,
      useFactory: () => ({
        databasePath: process.env.CRM_DB_PATH,
        reset: process.env.CRM_RESET_DB === "true",
        seed: process.env.CRM_SEED !== "false",
      }),
    },
    CrmStore,
    CrmService,
  ],
  exports: [CrmStore, CrmService, CRM_DATABASE_OPTIONS],
})
export class CrmModule {}
