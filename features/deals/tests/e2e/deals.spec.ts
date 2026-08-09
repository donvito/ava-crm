import { expect, test } from "@playwright/test";

test("user can create a deal and move it across stages", async ({ page }) => {
  await page.goto("/deals");

  await expect(
    page.getByRole("heading", { name: "Deals", exact: true }),
  ).toBeVisible();

  const title = `Expansion deal ${Date.now()}`;
  await page.getByLabel("Deal title").fill(title);
  await page.getByLabel("Value (USD)").fill("15000");
  await page.getByLabel("Company").selectOption({ label: "Fixture Co" });
  await page.getByRole("button", { name: "Create deal" }).click();

  const card = page.locator(".deal-card", { hasText: title });
  await expect(card).toBeVisible();
  await expect(page.getByRole("heading", { name: "Lead" })).toBeVisible();

  await card.getByLabel(`Move ${title} to stage`).selectOption("qualified");
  await expect(
    page.locator(".pipeline-column", { has: page.getByRole("heading", { name: "Qualified" }) }).getByText(title),
  ).toBeVisible();

  await page.reload();
  await expect(
    page.locator(".pipeline-column", { has: page.getByRole("heading", { name: "Qualified" }) }).getByText(title),
  ).toBeVisible();
});
