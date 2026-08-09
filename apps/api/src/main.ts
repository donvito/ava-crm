import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api");
  app.enableCors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
  });

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
  console.log(`Ava CRM Nest API listening on http://localhost:${port}`);
}

bootstrap();
