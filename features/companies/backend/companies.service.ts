import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DatabaseService } from "@platform/database/database.service";
import type { CompanyInput } from "../contracts/types";
import {
  createCompany,
  deleteCompany,
  getCompany,
  listCompanies,
  updateCompany,
} from "./repository";

@Injectable()
export class CompaniesService {
  constructor(private readonly database: DatabaseService) {}

  list() {
    return listCompanies(this.database.getDb());
  }

  get(id: number) {
    const company = getCompany(this.database.getDb(), id);
    if (!company) throw new NotFoundException("Company not found");
    return company;
  }

  create(input: CompanyInput) {
    if (!input.name?.trim()) {
      throw new BadRequestException("Name is required");
    }
    return createCompany(this.database.getDb(), input);
  }

  update(id: number, input: CompanyInput) {
    if (!input.name?.trim()) {
      throw new BadRequestException("Name is required");
    }
    const company = updateCompany(this.database.getDb(), id, input);
    if (!company) throw new NotFoundException("Company not found");
    return company;
  }

  remove(id: number) {
    const deleted = deleteCompany(this.database.getDb(), id);
    if (!deleted) throw new NotFoundException("Company not found");
    return { ok: true };
  }
}
