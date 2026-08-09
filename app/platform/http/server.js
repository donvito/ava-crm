import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";

const uiPublicDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../ui/public"
);

/**
 * Assemble the HTTP app from feature slices.
 * Each feature provides: { name, router (mounted at /api/<name>), frontendDir (served at /<name>) }
 */
export function createApp({ features }) {
  const app = express();
  app.use(express.json());
  app.use("/ui", express.static(uiPublicDir));

  for (const feature of features) {
    if (feature.router) app.use(`/api/${feature.name}`, feature.router);
    if (feature.frontendDir)
      app.use(`/${feature.name}`, express.static(feature.frontendDir));
  }

  app.get("/api/meta/features", (_req, res) =>
    res.json({ features: features.map((f) => f.name) })
  );

  const home = features.find((f) => f.frontendDir);
  app.get("/", (_req, res) =>
    home ? res.redirect(`/${home.name}/`) : res.status(404).end()
  );

  // Uniform JSON error handling for feature routes.
  app.use((err, _req, res, _next) => {
    const status = err.status ?? 500;
    res.status(status).json({ error: err.message ?? "Internal error" });
  });

  return app;
}
