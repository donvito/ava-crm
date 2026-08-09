import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { Contact, Dashboard, Deal } from "../../../contracts";
import { CrmStore } from "../database/crm-store.service";
import {
  ContactQueryDto,
  CreateContactDto,
  CreateDealDto,
  DealQueryDto,
  UpdateContactDto,
  UpdateDealDto,
} from "./crm.dto";

@Injectable()
export class CrmService {
  constructor(@Inject(CrmStore) private readonly store: CrmStore) {}

  health() {
    return { status: "ok", database: "sqlite", framework: "nestjs" };
  }

  dashboard(): Dashboard {
    return this.store.getDashboard();
  }

  contacts(query: ContactQueryDto): Contact[] {
    return this.store.listContacts({
      search: query.search,
      status: query.status,
    });
  }

  contact(id: number): Contact {
    const contact = this.store.getContact(id);
    if (!contact) throw new NotFoundException("Contact not found.");
    return contact;
  }

  createContact(input: CreateContactDto): Contact {
    try {
      return this.store.createContact(input);
    } catch (error) {
      if (this.isUniqueConstraint(error)) {
        throw new ConflictException({
          message: "A contact with this email already exists.",
          errors: { email: "This email is already in your contacts." },
        });
      }
      throw error;
    }
  }

  updateContact(id: number, input: UpdateContactDto): Contact {
    this.contact(id);
    try {
      return this.store.updateContact(id, input) as Contact;
    } catch (error) {
      if (this.isUniqueConstraint(error)) {
        throw new ConflictException({
          message: "A contact with this email already exists.",
          errors: { email: "This email is already in your contacts." },
        });
      }
      throw error;
    }
  }

  deleteContact(id: number): void {
    if (!this.store.deleteContact(id)) {
      throw new NotFoundException("Contact not found.");
    }
  }

  deals(query: DealQueryDto): Deal[] {
    return this.store.listDeals({ stage: query.stage });
  }

  deal(id: number): Deal {
    const deal = this.store.getDeal(id);
    if (!deal) throw new NotFoundException("Deal not found.");
    return deal;
  }

  createDeal(input: CreateDealDto): Deal {
    this.assertContactExists(input.contactId);
    return this.store.createDeal(input);
  }

  updateDeal(id: number, input: UpdateDealDto): Deal {
    this.deal(id);
    this.assertContactExists(input.contactId);
    return this.store.updateDeal(id, input) as Deal;
  }

  deleteDeal(id: number): void {
    if (!this.store.deleteDeal(id)) {
      throw new NotFoundException("Deal not found.");
    }
  }

  completeTask(id: number, completed: boolean) {
    const task = this.store.completeTask(id, completed);
    if (!task) throw new NotFoundException("Task not found.");
    return task;
  }

  private assertContactExists(contactId: number | null | undefined): void {
    if (contactId && !this.store.getContact(contactId)) {
      throw new UnprocessableEntityException({
        message: "Check the highlighted fields.",
        errors: { contactId: "The selected contact no longer exists." },
      });
    }
  }

  private isUniqueConstraint(error: unknown): boolean {
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "SQLITE_CONSTRAINT_UNIQUE"
    );
  }
}
