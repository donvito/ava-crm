import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { closeDb, getDb, type Db } from "./db";

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  getDb(): Db {
    return getDb();
  }

  onModuleDestroy() {
    closeDb();
  }
}
