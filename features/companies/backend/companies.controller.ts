import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from "@nestjs/common";
import type { CompanyInput } from "../contracts/types";
import { CompaniesService } from "./companies.service";

@Controller("companies")
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  list() {
    return { companies: this.companiesService.list() };
  }

  @Get(":id")
  get(@Param("id", ParseIntPipe) id: number) {
    return { company: this.companiesService.get(id) };
  }

  @Post()
  create(@Body() body: CompanyInput) {
    return { company: this.companiesService.create(body) };
  }

  @Put(":id")
  update(@Param("id", ParseIntPipe) id: number, @Body() body: CompanyInput) {
    return { company: this.companiesService.update(id, body) };
  }

  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.companiesService.remove(id);
  }
}
