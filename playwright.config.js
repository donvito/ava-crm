import { defineConfig } from "@playwright/test";

const PORT = process.env.PORT ?? "4123";
const FEATURES = process.env.FEATURES ?? "companies,contacts,deals";
// PW_VIDEO=1 records a video of every test (with slight slow-motion so the
// interactions are watchable). Videos land in test-results/<test>/video.webm.
const RECORD_VIDEO = process.env.PW_VIDEO === "1";

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
    video: RECORD_VIDEO ? "on" : "off",
    launchOptions: RECORD_VIDEO ? { slowMo: 250 } : {},
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
