#!/usr/bin/env tsx
import { spawnSync } from "node:child_process";

const feature = process.argv[2] ?? "all";

const unit = spawnSync("npx", ["vitest", "run"], {
  stdio: "inherit",
  env: process.env,
});
if (unit.status !== 0) process.exit(unit.status ?? 1);

const e2eArgs =
  feature === "all"
    ? ["playwright", "test"]
    : ["playwright", "test", `features/${feature}/tests/e2e`];

const e2e = spawnSync("npx", e2eArgs, {
  stdio: "inherit",
  env: process.env,
});
process.exit(e2e.status ?? 1);
