import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from "@nestjs/common";
import type { DealInput } from "../contracts/types";
import { DealsService } from "./deals.service";

@Controller("deals")
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @Get()
  list(@Query("stage") stage?: string) {
    return { deals: this.dealsService.list(stage) };
  }

  @Get("pipeline")
  pipeline() {
    return { pipeline: this.dealsService.pipeline() };
  }

  @Get(":id")
  get(@Param("id", ParseIntPipe) id: number) {
    return { deal: this.dealsService.get(id) };
  }

  @Post()
  create(@Body() body: DealInput) {
    return { deal: this.dealsService.create(body) };
  }

  @Put(":id")
  update(@Param("id", ParseIntPipe) id: number, @Body() body: DealInput) {
    return { deal: this.dealsService.update(id, body) };
  }

  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.dealsService.remove(id);
  }
}
