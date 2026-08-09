import { test, expect } from "@playwright/test";

test.describe("companies", () => {
  test("user can create a company and it persists after reload", async ({
    page,
  }) => {
    await page.goto("/companies/");

    await page.getByLabel("Name").fill("Globex Corporation");
    await page.getByLabel("Industry").fill("Energy");
    await page.getByLabel("Website").fill("globex.com");
    await page.getByRole("button", { name: "Add company" }).click();

    const row = page.getByRole("row", { name: /Globex Corporation/ });
    await expect(row).toBeVisible();
    await expect(row).toContainText("Energy");
    await expect(row).toContainText("globex.com");

    await page.reload();
    await expect(page.getByRole("row", { name: /Globex Corporation/ })).toBeVisible();
  });

  test("user sees validation errors for an empty name", async ({ page }) => {
    await page.goto("/companies/");
    await page.getByRole("button", { name: "Add company" }).click();
    await expect(page.getByRole("alert")).toContainText("Name is required");
  });

  test("user sees a validation error for a bad website", async ({ page }) => {
    await page.goto("/companies/");
    await page.getByLabel("Name").fill("Bad Website Inc");
    await page.getByLabel("Website").fill("not a url");
    await page.getByRole("button", { name: "Add company" }).click();
    await expect(page.getByRole("alert")).toContainText("Website must be a valid URL");
  });

  test("user can delete a company", async ({ page }) => {
    await page.goto("/companies/");
    await page.getByLabel("Name").fill("Doomed LLC");
    await page.getByRole("button", { name: "Add company" }).click();
    await expect(page.getByRole("row", { name: /Doomed LLC/ })).toBeVisible();

    await page.getByRole("button", { name: "Delete Doomed LLC" }).click();
    await expect(page.getByRole("row", { name: /Doomed LLC/ })).toBeHidden();

    await page.reload();
    await expect(page.getByRole("row", { name: /Doomed LLC/ })).toBeHidden();
  });
});
