import { Hono } from "hono";
import { getDb } from "../../../app/platform/database/db.ts";
import {
  createDeal,
  deleteDeal,
  getDeal,
  getPipelineSummary,
  listDeals,
  updateDeal,
} from "./repository.ts";
import { DEAL_STAGES, type DealInput, type DealStage } from "../contracts/types.ts";

function isDealStage(value: string): value is DealStage {
  return (DEAL_STAGES as readonly string[]).includes(value);
}

export function createDealsRoutes() {
  const app = new Hono();

  app.get("/", (c) => {
    const stageParam = c.req.query("stage");
    if (stageParam && !isDealStage(stageParam)) {
      return c.json({ error: "Invalid stage" }, 400);
    }
    return c.json({ deals: listDeals(getDb(), stageParam) });
  });

  app.get("/pipeline", (c) => {
    return c.json({ pipeline: getPipelineSummary(getDb()) });
  });

  app.get("/:id", (c) => {
    const id = Number(c.req.param("id"));
    if (!Number.isInteger(id)) {
      return c.json({ error: "Invalid deal id" }, 400);
    }
    const deal = getDeal(getDb(), id);
    if (!deal) return c.json({ error: "Deal not found" }, 404);
    return c.json({ deal });
  });

  app.post("/", async (c) => {
    const body = (await c.req.json()) as DealInput;
    if (!body.title?.trim()) {
      return c.json({ error: "Title is required" }, 400);
    }
    if (body.stage && !isDealStage(body.stage)) {
      return c.json({ error: "Invalid stage" }, 400);
    }
    const deal = createDeal(getDb(), body);
    return c.json({ deal }, 201);
  });

  app.put("/:id", async (c) => {
    const id = Number(c.req.param("id"));
    if (!Number.isInteger(id)) {
      return c.json({ error: "Invalid deal id" }, 400);
    }
    const body = (await c.req.json()) as DealInput;
    if (!body.title?.trim()) {
      return c.json({ error: "Title is required" }, 400);
    }
    if (body.stage && !isDealStage(body.stage)) {
      return c.json({ error: "Invalid stage" }, 400);
    }
    const deal = updateDeal(getDb(), id, body);
    if (!deal) return c.json({ error: "Deal not found" }, 404);
    return c.json({ deal });
  });

  app.delete("/:id", (c) => {
    const id = Number(c.req.param("id"));
    if (!Number.isInteger(id)) {
      return c.json({ error: "Invalid deal id" }, 400);
    }
    const deleted = deleteDeal(getDb(), id);
    if (!deleted) return c.json({ error: "Deal not found" }, 404);
    return c.json({ ok: true });
  });

  return app;
}
