import {
  INestApplication,
  Type,
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
  app.useGlobalPipes(createCrmValidationPipe());

  app.enableCors({
    origin: process.env.CRM_WEB_ORIGIN ?? "http://localhost:3000",
  });
}

export function createCrmValidationPipe(
  expectedType?: Type<unknown>,
): ValidationPipe {
  return new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    expectedType,
    exceptionFactory: (errors) =>
      new UnprocessableEntityException({
        message: "Check the highlighted fields.",
        errors: validationErrors(errors),
      }),
  });
}
