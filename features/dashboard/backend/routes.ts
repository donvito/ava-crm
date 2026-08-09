import { Hono } from "hono";
import { getDb } from "../../../app/platform/database/db.ts";
import { getDashboardSummary } from "./repository.ts";

export function createDashboardRoutes() {
  const app = new Hono();

  app.get("/", (c) => {
    return c.json({ dashboard: getDashboardSummary(getDb()) });
  });

  return app;
}
