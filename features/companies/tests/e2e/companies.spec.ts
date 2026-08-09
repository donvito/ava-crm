import { expect, test } from "@playwright/test";

test("user can create a company and see it persist", async ({ page }) => {
  await page.goto("/companies");

  await expect(
    page.getByRole("heading", { name: "Companies", exact: true }),
  ).toBeVisible();

  const uniqueName = `Atlas Marine ${Date.now()}`;
  await page.getByLabel("Company name").fill(uniqueName);
  await page.getByLabel("Industry").fill("Shipping");
  await page.getByLabel("Website").fill("https://atlas.example");
  await page.getByRole("button", { name: "Create company" }).click();

  await expect(page.getByRole("cell", { name: uniqueName })).toBeVisible();

  await page.reload();
  await expect(page.getByText(uniqueName)).toBeVisible();
});
