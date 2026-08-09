import { Global, Module } from "@nestjs/common";
import { openDatabase } from "./db";

/** Nest injection token for the shared SQLite handle. */
export const DATABASE = "PLATFORM_DATABASE";

@Global()
@Module({
  providers: [{ provide: DATABASE, useFactory: () => openDatabase() }],
  exports: [DATABASE],
})
export class DatabaseModule {}
