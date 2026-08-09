import {
  INestApplication,
  UnprocessableEntityException,
  ValidationError,
  ValidationPipe,
} from "@nestjs/common";

function validationErrors(errors: ValidationError[]) {
  return errors.reduce<Record<string, string>>((result, error) => {
    if (error.constraints) {
      result[error.property] = Object.values(error.constraints)[0];
    }
    if (error.children?.length) {
      Object.assign(result, validationErrors(error.children));
    }
    return result;
  }, {});
}

export function configureCrmApplication(app: INestApplication): void {
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) =>
        new UnprocessableEntityException({
          message: "Check the highlighted fields.",
          errors: validationErrors(errors),
        }),
    }),
  );

  app.enableCors({
    origin: process.env.CRM_WEB_ORIGIN ?? "http://localhost:3000",
  });
}
