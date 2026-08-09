import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Playwright owns *.spec.js under tests/e2e; Vitest owns unit + integration.
    include: [
      "features/**/tests/unit/**/*.test.js",
      "features/**/tests/integration/**/*.test.js",
    ],
  },
});
