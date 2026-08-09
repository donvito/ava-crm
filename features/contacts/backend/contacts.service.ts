import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DatabaseService } from "@platform/database/database.service";
import type { ContactInput } from "../contracts/types";
import {
  createContact,
  deleteContact,
  getContact,
  listContacts,
  updateContact,
} from "./repository";

@Injectable()
export class ContactsService {
  constructor(private readonly database: DatabaseService) {}

  list() {
    return listContacts(this.database.getDb());
  }

  get(id: number) {
    const contact = getContact(this.database.getDb(), id);
    if (!contact) throw new NotFoundException("Contact not found");
    return contact;
  }

  create(input: ContactInput) {
    if (!input.firstName?.trim() || !input.lastName?.trim()) {
      throw new BadRequestException("First and last name are required");
    }
    return createContact(this.database.getDb(), input);
  }

  update(id: number, input: ContactInput) {
    if (!input.firstName?.trim() || !input.lastName?.trim()) {
      throw new BadRequestException("First and last name are required");
    }
    const contact = updateContact(this.database.getDb(), id, input);
    if (!contact) throw new NotFoundException("Contact not found");
    return contact;
  }

  remove(id: number) {
    const deleted = deleteContact(this.database.getDb(), id);
    if (!deleted) throw new NotFoundException("Contact not found");
    return { ok: true };
  }
}
