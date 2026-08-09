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
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { COMPANY_DIRECTORY } from "../../companies/contracts/company-directory";
import type { CompanyDirectory } from "../../companies/contracts/company-directory";
import { CONTACT_DIRECTORY } from "../../contacts/contracts/contact-directory";
import type { ContactDirectory } from "../../contacts/contracts/contact-directory";
import { DealRepository } from "./repository";
import type { Deal } from "./repository";
import { STAGES, validateDeal, validateStageChange } from "./validation";
import type { Stage } from "./validation";

export const DEAL_REPOSITORY = "DEAL_REPOSITORY";

@Controller("deals")
export class DealsController {
  constructor(
    @Inject(DEAL_REPOSITORY) private readonly repository: DealRepository,
    @Inject(CONTACT_DIRECTORY) private readonly contactDirectory: ContactDirectory,
    @Inject(COMPANY_DIRECTORY) private readonly companyDirectory: CompanyDirectory
  ) {}

  private enrich(deal: Deal) {
    return {
      ...deal,
      contact_name:
        deal.contact_id != null
          ? this.contactDirectory.getName(deal.contact_id) ?? null
          : null,
      company_name:
        deal.company_id != null
          ? this.companyDirectory.getName(deal.company_id) ?? null
          : null,
    };
  }

  @Get("stages")
  stages() {
    return STAGES;
  }

  @Get("contact-options")
  contactOptions() {
    return this.contactDirectory.listOptions();
  }

  @Get("company-options")
  companyOptions() {
    return this.companyDirectory.listOptions();
  }

  @Get()
  list(@Query("stage") stage?: string) {
    if (stage && !STAGES.includes(stage as Stage))
      throw new BadRequestException({ errors: { stage: "Stage is invalid" } });
    return this.repository
      .list({ stage: stage as Stage | undefined })
      .map((d) => this.enrich(d));
  }

  @Post()
  create(@Body() body: unknown) {
    const { valid, errors, value } = validateDeal(body);
    if (!valid) throw new BadRequestException({ errors });
    return this.enrich(this.repository.create(value));
  }

  @Get(":id")
  get(@Param("id") id: string) {
    const deal = this.repository.get(Number(id));
    if (!deal) throw new NotFoundException({ error: "Deal not found" });
    return this.enrich(deal);
  }

  @Patch(":id/stage")
  setStage(@Param("id") id: string, @Body() body: unknown) {
    const { valid, errors, value } = validateStageChange(body);
    if (!valid) throw new BadRequestException({ errors });
    const deal = this.repository.setStage(Number(id), value.stage);
    if (!deal) throw new NotFoundException({ error: "Deal not found" });
    return this.enrich(deal);
  }

  @Delete(":id")
  @HttpCode(204)
  remove(@Param("id") id: string) {
    if (!this.repository.remove(Number(id)))
      throw new NotFoundException({ error: "Deal not found" });
  }
}
