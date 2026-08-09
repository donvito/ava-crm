import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DatabaseService } from "@platform/database/database.service";
import { DEAL_STAGES, type DealInput, type DealStage } from "../contracts/types";
import {
  createDeal,
  deleteDeal,
  getDeal,
  getPipelineSummary,
  listDeals,
  updateDeal,
} from "./repository";

function isDealStage(value: string): value is DealStage {
  return (DEAL_STAGES as readonly string[]).includes(value);
}

@Injectable()
export class DealsService {
  constructor(private readonly database: DatabaseService) {}

  list(stage?: string) {
    if (stage && !isDealStage(stage)) {
      throw new BadRequestException("Invalid stage");
    }
    return listDeals(
      this.database.getDb(),
      stage && isDealStage(stage) ? stage : undefined,
    );
  }

  pipeline() {
    return getPipelineSummary(this.database.getDb());
  }

  get(id: number) {
    const deal = getDeal(this.database.getDb(), id);
    if (!deal) throw new NotFoundException("Deal not found");
    return deal;
  }

  create(input: DealInput) {
    if (!input.title?.trim()) {
      throw new BadRequestException("Title is required");
    }
    if (input.stage && !isDealStage(input.stage)) {
      throw new BadRequestException("Invalid stage");
    }
    return createDeal(this.database.getDb(), input);
  }

  update(id: number, input: DealInput) {
    if (!input.title?.trim()) {
      throw new BadRequestException("Title is required");
    }
    if (input.stage && !isDealStage(input.stage)) {
      throw new BadRequestException("Invalid stage");
    }
    const deal = updateDeal(this.database.getDb(), id, input);
    if (!deal) throw new NotFoundException("Deal not found");
    return deal;
  }

  remove(id: number) {
    const deleted = deleteDeal(this.database.getDb(), id);
    if (!deleted) throw new NotFoundException("Deal not found");
    return { ok: true };
  }
}
