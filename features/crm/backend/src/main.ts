import "reflect-metadata";
import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { configureCrmApplication } from "./application";
import { CrmStore } from "./database/crm-store.service";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureCrmApplication(app);
  app.enableShutdownHooks();

  const port = Number.parseInt(process.env.API_PORT ?? "4000", 10);
  await app.listen(port, "0.0.0.0");

  const store = app.get(CrmStore);
  Logger.log(`NestJS CRM API ready at http://localhost:${port}`, "Bootstrap");
  Logger.log(`SQLite database: ${store.databasePath}`, "Bootstrap");
}

void bootstrap();
