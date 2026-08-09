import { Injectable } from "@nestjs/common";
import { DatabaseService } from "@platform/database/database.service";
import { getDashboardSummary } from "./repository";

@Injectable()
export class DashboardService {
  constructor(private readonly database: DatabaseService) {}

  summary() {
    return getDashboardSummary(this.database.getDb());
  }
}
