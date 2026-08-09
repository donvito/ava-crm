import { Hono } from "hono";
import { getDb } from "../../../app/platform/database/db.ts";
import {
  createContact,
  deleteContact,
  getContact,
  listContacts,
  updateContact,
} from "./repository.ts";
import type { ContactInput } from "../contracts/types.ts";

export function createContactsRoutes() {
  const app = new Hono();

  app.get("/", (c) => {
    return c.json({ contacts: listContacts(getDb()) });
  });

  app.get("/:id", (c) => {
    const id = Number(c.req.param("id"));
    if (!Number.isInteger(id)) {
      return c.json({ error: "Invalid contact id" }, 400);
    }
    const contact = getContact(getDb(), id);
    if (!contact) return c.json({ error: "Contact not found" }, 404);
    return c.json({ contact });
  });

  app.post("/", async (c) => {
    const body = (await c.req.json()) as ContactInput;
    if (!body.firstName?.trim() || !body.lastName?.trim()) {
      return c.json({ error: "First and last name are required" }, 400);
    }
    const contact = createContact(getDb(), body);
    return c.json({ contact }, 201);
  });

  app.put("/:id", async (c) => {
    const id = Number(c.req.param("id"));
    if (!Number.isInteger(id)) {
      return c.json({ error: "Invalid contact id" }, 400);
    }
    const body = (await c.req.json()) as ContactInput;
    if (!body.firstName?.trim() || !body.lastName?.trim()) {
      return c.json({ error: "First and last name are required" }, 400);
    }
    const contact = updateContact(getDb(), id, body);
    if (!contact) return c.json({ error: "Contact not found" }, 404);
    return c.json({ contact });
  });

  app.delete("/:id", (c) => {
    const id = Number(c.req.param("id"));
    if (!Number.isInteger(id)) {
      return c.json({ error: "Invalid contact id" }, 400);
    }
    const deleted = deleteContact(getDb(), id);
    if (!deleted) return c.json({ error: "Contact not found" }, 404);
    return c.json({ ok: true });
  });

  return app;
}
