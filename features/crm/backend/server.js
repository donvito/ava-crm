import express from "express";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { createCrmApp } from "./app.js";

const port = Number.parseInt(process.env.PORT ?? "4173", 10);
const isProduction = process.env.NODE_ENV === "production";
const app = createCrmApp();
let vite;

if (isProduction) {
  const distPath = resolve(process.cwd(), "dist");
  if (!existsSync(distPath)) {
    console.error("The dist directory is missing. Run `npm run build` first.");
    process.exit(1);
  }

  app.use(express.static(distPath));
  app.use((request, response, next) => {
    if (request.method === "GET" && request.accepts("html")) {
      return response.sendFile(resolve(distPath, "index.html"));
    }
    return next();
  });
} else {
  const { createServer: createViteServer } = await import("vite");
  vite = await createViteServer({
    root: process.cwd(),
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
}

const server = app.listen(port, "0.0.0.0", () => {
  console.log(`AVA CRM is ready at http://localhost:${port}`);
  console.log(`SQLite database: ${app.locals.crmStore.databasePath}`);
});

async function shutdown() {
  server.close(async () => {
    app.locals.crmStore.close();
    if (vite) await vite.close();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
