import { test, expect } from "@playwright/test";

// Runs in the deals sandbox (FEATURES=deals), where the contact/company
// dropdowns are served by the fake directory adapters.
test.describe("deals", () => {
  test("user can create a deal linked to a contact and company, and it persists", async ({
    page,
  }) => {
    await page.goto("/deals/");

    await page.getByLabel("Title").fill("Enterprise license");
    await page.getByLabel("Value (USD)").fill("12500");
    await page.getByLabel("Contact").selectOption({ label: "Fake Contact Ada" });
    await page.getByLabel("Company").selectOption({ label: "Fake Company One" });
    await page.getByRole("button", { name: "Add deal" }).click();

    const row = page.getByRole("row", { name: /Enterprise license/ });
    await expect(row).toBeVisible();
    await expect(row).toContainText("$12,500.00");
    await expect(row).toContainText("Fake Contact Ada");
    await expect(row).toContainText("Fake Company One");

    await page.reload();
    await expect(
      page.getByRole("row", { name: /Enterprise license/ })
    ).toBeVisible();
  });

  test("user sees a validation error for a missing title", async ({ page }) => {
    await page.goto("/deals/");
    await page.getByRole("button", { name: "Add deal" }).click();
    await expect(
      page.getByRole("region", { name: "Add deal" }).getByRole("alert")
    ).toContainText("Title is required");
  });

  test("user sees a validation error for a negative value", async ({ page }) => {
    await page.goto("/deals/");
    await page.getByLabel("Title").fill("Bad value deal");
    await page.getByLabel("Value (USD)").fill("-10");
    await page.getByRole("button", { name: "Add deal" }).click();
    await expect(
      page.getByRole("region", { name: "Add deal" }).getByRole("alert")
    ).toContainText("Value must be a non-negative number");
  });

  test("user can move a deal through the pipeline to won", async ({ page }) => {
    await page.goto("/deals/");
    await page.getByLabel("Title").fill("Pipeline deal");
    await page.getByRole("button", { name: "Add deal" }).click();

    const stageSelect = page.getByLabel("Stage for Pipeline deal");
    await expect(stageSelect).toHaveValue("lead");

    await stageSelect.selectOption("qualified");
    await expect(page.getByLabel("Stage for Pipeline deal")).toHaveValue(
      "qualified"
    );

    await page.getByLabel("Stage for Pipeline deal").selectOption("won");
    const row = page.getByRole("row", { name: /Pipeline deal/ });
    await expect(row.getByText("Won")).toBeVisible();

    await page.reload();
    await expect(
      page.getByRole("row", { name: /Pipeline deal/ }).getByText("Won")
    ).toBeVisible();
  });

  test("user can filter deals by stage", async ({ page }) => {
    await page.goto("/deals/");

    await page.getByLabel("Title").fill("Filter lead deal");
    await page.getByRole("button", { name: "Add deal" }).click();
    await expect(page.getByRole("row", { name: /Filter lead deal/ })).toBeVisible();

    await page.getByLabel("Title").fill("Filter won deal");
    await page.getByRole("button", { name: "Add deal" }).click();
    await page.getByLabel("Stage for Filter won deal").selectOption("won");
    await expect(
      page
        .getByRole("row", { name: /Filter won deal/ })
        .getByText("Won", { exact: true })
    ).toBeVisible();

    await page.getByLabel("Filter by stage").selectOption("won");
    await expect(page.getByRole("row", { name: /Filter won deal/ })).toBeVisible();
    await expect(page.getByRole("row", { name: /Filter lead deal/ })).toBeHidden();

    await page.getByLabel("Filter by stage").selectOption("");
    await expect(page.getByRole("row", { name: /Filter lead deal/ })).toBeVisible();
  });

  test("user can delete a deal", async ({ page }) => {
    await page.goto("/deals/");
    await page.getByLabel("Title").fill("Doomed deal");
    await page.getByRole("button", { name: "Add deal" }).click();
    await expect(page.getByRole("row", { name: /Doomed deal/ })).toBeVisible();

    await page.getByRole("button", { name: "Delete Doomed deal" }).click();
    await expect(page.getByRole("row", { name: /Doomed deal/ })).toBeHidden();

    await page.reload();
    await expect(page.getByRole("row", { name: /Doomed deal/ })).toBeHidden();
  });
});
