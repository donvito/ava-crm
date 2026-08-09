import { Hono } from "hono";
import { getDb } from "../../../app/platform/database/db.ts";
import {
  createCompany,
  deleteCompany,
  getCompany,
  listCompanies,
  updateCompany,
} from "./repository.ts";
import type { CompanyInput } from "../contracts/types.ts";

export function createCompaniesRoutes() {
  const app = new Hono();

  app.get("/", (c) => {
    return c.json({ companies: listCompanies(getDb()) });
  });

  app.get("/:id", (c) => {
    const id = Number(c.req.param("id"));
    if (!Number.isInteger(id)) {
      return c.json({ error: "Invalid company id" }, 400);
    }
    const company = getCompany(getDb(), id);
    if (!company) return c.json({ error: "Company not found" }, 404);
    return c.json({ company });
  });

  app.post("/", async (c) => {
    const body = (await c.req.json()) as CompanyInput;
    if (!body.name?.trim()) {
      return c.json({ error: "Name is required" }, 400);
    }
    const company = createCompany(getDb(), body);
    return c.json({ company }, 201);
  });

  app.put("/:id", async (c) => {
    const id = Number(c.req.param("id"));
    if (!Number.isInteger(id)) {
      return c.json({ error: "Invalid company id" }, 400);
    }
    const body = (await c.req.json()) as CompanyInput;
    if (!body.name?.trim()) {
      return c.json({ error: "Name is required" }, 400);
    }
    const company = updateCompany(getDb(), id, body);
    if (!company) return c.json({ error: "Company not found" }, 404);
    return c.json({ company });
  });

  app.delete("/:id", (c) => {
    const id = Number(c.req.param("id"));
    if (!Number.isInteger(id)) {
      return c.json({ error: "Invalid company id" }, 400);
    }
    const deleted = deleteCompany(getDb(), id);
    if (!deleted) return c.json({ error: "Company not found" }, 404);
    return c.json({ ok: true });
  });

  return app;
}
