import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  NotFoundException,
  Param,
  Post,
  Put,
} from "@nestjs/common";
import { CompanyRepository } from "./repository";
import { validateCompany } from "./validation";

export const COMPANY_REPOSITORY = "COMPANY_REPOSITORY";

@Controller("companies")
export class CompaniesController {
  constructor(
    @Inject(COMPANY_REPOSITORY) private readonly repository: CompanyRepository
  ) {}

  @Get()
  list() {
    return this.repository.list();
  }

  @Post()
  create(@Body() body: unknown) {
    const { valid, errors, value } = validateCompany(body);
    if (!valid) throw new BadRequestException({ errors });
    return this.repository.create(value);
  }

  @Get(":id")
  get(@Param("id") id: string) {
    const company = this.repository.get(Number(id));
    if (!company) throw new NotFoundException({ error: "Company not found" });
    return company;
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() body: unknown) {
    const { valid, errors, value } = validateCompany(body);
    if (!valid) throw new BadRequestException({ errors });
    const company = this.repository.update(Number(id), value);
    if (!company) throw new NotFoundException({ error: "Company not found" });
    return company;
  }

  @Delete(":id")
  @HttpCode(204)
  remove(@Param("id") id: string) {
    if (!this.repository.remove(Number(id)))
      throw new NotFoundException({ error: "Company not found" });
  }
}
