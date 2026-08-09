import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./features/crm/tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 40_000,
  expect: {
    timeout: 8_000,
  },
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command:
      "CRM_DB_PATH=.tmp/playwright-crm.sqlite CRM_RESET_DB=true npm run dev",
    url: "http://127.0.0.1:3000/api/health",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
