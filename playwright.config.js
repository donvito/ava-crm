import { defineConfig } from "@playwright/test";

const PORT = process.env.PORT ?? "4123";
const FEATURES = process.env.FEATURES ?? "companies,contacts,deals";

export default defineConfig({
  testMatch: [
    "features/**/tests/e2e/**/*.spec.js",
    "journeys/e2e/**/*.spec.js",
  ],
  // Tests share one SQLite database per run; keep them serial.
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "node server.js",
    port: Number(PORT),
    reuseExistingServer: false,
    env: {
      PORT,
      FEATURES,
      DB_PATH: `.tmp/e2e-${FEATURES.replaceAll(",", "-")}.db`,
      DB_RESET: "1",
    },
  },
});
