import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

const enabled = new Set(
  (process.env.FEATURES ?? "companies,contacts,deals")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean)
);

async function bootstrap() {
  const app = await NestFactory.create(AppModule.register(enabled), {
    logger: ["warn", "error"],
  });
  app.setGlobalPrefix("api");
  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
  console.log(
    `AVA CRM API listening on http://localhost:${port} (features: ${[...enabled].join(", ")})`
  );
}

bootstrap();
