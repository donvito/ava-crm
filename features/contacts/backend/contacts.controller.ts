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
import { COMPANY_DIRECTORY } from "../../companies/contracts/company-directory";
import type { CompanyDirectory } from "../../companies/contracts/company-directory";
import { ContactRepository } from "./repository";
import type { Contact } from "./repository";
import { validateContact } from "./validation";

export const CONTACT_REPOSITORY = "CONTACT_REPOSITORY";

@Controller("contacts")
export class ContactsController {
  constructor(
    @Inject(CONTACT_REPOSITORY) private readonly repository: ContactRepository,
    @Inject(COMPANY_DIRECTORY) private readonly companyDirectory: CompanyDirectory
  ) {}

  private withCompanyName(contact: Contact) {
    return {
      ...contact,
      company_name:
        contact.company_id != null
          ? this.companyDirectory.getName(contact.company_id) ?? null
          : null,
    };
  }

  // Options for the company <select>, resolved through the CompanyDirectory contract.
  @Get("company-options")
  companyOptions() {
    return this.companyDirectory.listOptions();
  }

  @Get()
  list() {
    return this.repository.list().map((c) => this.withCompanyName(c));
  }

  @Post()
  create(@Body() body: unknown) {
    const { valid, errors, value } = validateContact(body);
    if (!valid) throw new BadRequestException({ errors });
    return this.withCompanyName(this.repository.create(value));
  }

  @Get(":id")
  get(@Param("id") id: string) {
    const contact = this.repository.get(Number(id));
    if (!contact) throw new NotFoundException({ error: "Contact not found" });
    return this.withCompanyName(contact);
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() body: unknown) {
    const { valid, errors, value } = validateContact(body);
    if (!valid) throw new BadRequestException({ errors });
    const contact = this.repository.update(Number(id), value);
    if (!contact) throw new NotFoundException({ error: "Contact not found" });
    return this.withCompanyName(contact);
  }

  @Delete(":id")
  @HttpCode(204)
  remove(@Param("id") id: string) {
    if (!this.repository.remove(Number(id)))
      throw new NotFoundException({ error: "Contact not found" });
  }
}
