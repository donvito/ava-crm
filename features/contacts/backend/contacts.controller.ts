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
import type { ContactInput } from "../contracts/types";
import { ContactsService } from "./contacts.service";

@Controller("contacts")
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get()
  list() {
    return { contacts: this.contactsService.list() };
  }

  @Get(":id")
  get(@Param("id", ParseIntPipe) id: number) {
    return { contact: this.contactsService.get(id) };
  }

  @Post()
  create(@Body() body: ContactInput) {
    return { contact: this.contactsService.create(body) };
  }

  @Put(":id")
  update(@Param("id", ParseIntPipe) id: number, @Body() body: ContactInput) {
    return { contact: this.contactsService.update(id, body) };
  }

  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.contactsService.remove(id);
  }
}
