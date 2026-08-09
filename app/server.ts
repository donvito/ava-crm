import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { getDb } from "./platform/database/db.ts";
import { createCompaniesRoutes } from "../features/companies/backend/routes.ts";
import { createContactsRoutes } from "../features/contacts/backend/routes.ts";
import { createDealsRoutes } from "../features/deals/backend/routes.ts";
import { createDashboardRoutes } from "../features/dashboard/backend/routes.ts";

export function createApp() {
  getDb();

  const app = new Hono();
  app.use(
    "*",
    cors({
      origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    }),
  );

  app.get("/api/health", (c) => c.json({ ok: true }));

  app.route("/api/companies", createCompaniesRoutes());
  app.route("/api/contacts", createContactsRoutes());
  app.route("/api/deals", createDealsRoutes());
  app.route("/api/dashboard", createDashboardRoutes());

  return app;
}

export function startServer(port = Number(process.env.PORT ?? 3001)) {
  const app = createApp();
  const server = serve({ fetch: app.fetch, port }, (info) => {
    console.log(`Ava CRM API listening on http://localhost:${info.port}`);
  });
  return { app, server };
}

const isDirectRun = process.argv[1]?.endsWith("server.ts");
if (isDirectRun) {
  startServer();
}
