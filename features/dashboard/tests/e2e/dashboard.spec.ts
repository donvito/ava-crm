import { expect, test } from "@playwright/test";

test("dashboard shows CRM summary from sqlite data", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByText("Ava")).toBeVisible();
  await expect(page.getByRole("main").getByText("Companies", { exact: true })).toBeVisible();
  await expect(page.getByText("Open deals")).toBeVisible();
  await expect(page.getByText("Fixture deal")).toBeVisible();
  await expect(page.getByRole("link", { name: "Open pipeline" })).toBeVisible();
});
