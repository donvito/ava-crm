import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { CONTACT_STATUSES, DEAL_STAGES } from "../../../contracts";
import { createCrmValidationPipe } from "../application";
import {
  CompleteTaskDto,
  ContactQueryDto,
  CreateContactDto,
  CreateDealDto,
  DealQueryDto,
  UpdateContactDto,
  UpdateDealDto,
} from "./crm.dto";
import { CrmService } from "./crm.service";

@Controller("api")
export class CrmController {
  constructor(@Inject(CrmService) private readonly crm: CrmService) {}

  @Get("health")
  health() {
    return this.crm.health();
  }

  @Get("meta")
  meta() {
    return {
      contactStatuses: CONTACT_STATUSES,
      dealStages: DEAL_STAGES,
    };
  }

  @Get("dashboard")
  dashboard() {
    return this.crm.dashboard();
  }

  @Get("contacts")
  contacts(
    @Query(createCrmValidationPipe(ContactQueryDto)) query: ContactQueryDto,
  ) {
    return { contacts: this.crm.contacts(query) };
  }

  @Get("contacts/:id")
  contact(@Param("id", ParseIntPipe) id: number) {
    return { contact: this.crm.contact(id) };
  }

  @Post("contacts")
  createContact(
    @Body(createCrmValidationPipe(CreateContactDto)) input: CreateContactDto,
  ) {
    return { contact: this.crm.createContact(input) };
  }

  @Patch("contacts/:id")
  updateContact(
    @Param("id", ParseIntPipe) id: number,
    @Body(createCrmValidationPipe(UpdateContactDto)) input: UpdateContactDto,
  ) {
    return { contact: this.crm.updateContact(id, input) };
  }

  @Delete("contacts/:id")
  @HttpCode(204)
  deleteContact(@Param("id", ParseIntPipe) id: number): void {
    this.crm.deleteContact(id);
  }

  @Get("deals")
  deals(@Query(createCrmValidationPipe(DealQueryDto)) query: DealQueryDto) {
    return { deals: this.crm.deals(query) };
  }

  @Get("deals/:id")
  deal(@Param("id", ParseIntPipe) id: number) {
    return { deal: this.crm.deal(id) };
  }

  @Post("deals")
  createDeal(
    @Body(createCrmValidationPipe(CreateDealDto)) input: CreateDealDto,
  ) {
    return { deal: this.crm.createDeal(input) };
  }

  @Patch("deals/:id")
  updateDeal(
    @Param("id", ParseIntPipe) id: number,
    @Body(createCrmValidationPipe(UpdateDealDto)) input: UpdateDealDto,
  ) {
    return { deal: this.crm.updateDeal(id, input) };
  }

  @Delete("deals/:id")
  @HttpCode(204)
  deleteDeal(@Param("id", ParseIntPipe) id: number): void {
    this.crm.deleteDeal(id);
  }

  @Patch("tasks/:id")
  completeTask(
    @Param("id", ParseIntPipe) id: number,
    @Body(createCrmValidationPipe(CompleteTaskDto)) input: CompleteTaskDto,
  ) {
    return { task: this.crm.completeTask(id, input.completed) };
  }
}
