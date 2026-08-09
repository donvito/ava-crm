import { test, expect } from "@playwright/test";

// Runs in the contacts sandbox (FEATURES=contacts), where the company
// dropdown is served by the fake CompanyDirectory adapter.
test.describe("contacts", () => {
  test("user can create a contact with a company and it persists after reload", async ({
    page,
  }) => {
    await page.goto("/contacts/");

    await page.getByLabel("First name").fill("Ada");
    await page.getByLabel("Last name").fill("Lovelace");
    await page.getByLabel("Email").fill("ada@example.com");
    await page.getByLabel("Phone").fill("555-0100");
    await page.getByLabel("Company").selectOption({ label: "Fake Company One" });
    await page.getByRole("button", { name: "Add contact" }).click();

    const row = page.getByRole("row", { name: /Ada Lovelace/ });
    await expect(row).toBeVisible();
    await expect(row).toContainText("ada@example.com");
    await expect(row).toContainText("Fake Company One");

    await page.reload();
    await expect(page.getByRole("row", { name: /Ada Lovelace/ })).toBeVisible();
  });

  test("user sees validation errors for missing fields", async ({ page }) => {
    await page.goto("/contacts/");
    await page.getByRole("button", { name: "Add contact" }).click();
    const alert = page
      .getByRole("region", { name: "Add contact" })
      .getByRole("alert");
    await expect(alert).toContainText("First name is required");
    await expect(alert).toContainText("Email is required");
  });

  test("user sees a validation error for a malformed email", async ({ page }) => {
    await page.goto("/contacts/");
    await page.getByLabel("First name").fill("Bad");
    await page.getByLabel("Last name").fill("Email");
    await page.getByLabel("Email").fill("nope");
    await page.getByRole("button", { name: "Add contact" }).click();
    await expect(
      page.getByRole("region", { name: "Add contact" }).getByRole("alert")
    ).toContainText("Email must be a valid address");
  });

  test("user can edit a contact", async ({ page }) => {
    await page.goto("/contacts/");
    await page.getByLabel("First name").fill("Grace");
    await page.getByLabel("Last name").fill("Hopper");
    await page.getByLabel("Email").fill("grace@example.com");
    await page.getByRole("button", { name: "Add contact" }).click();
    await expect(page.getByRole("row", { name: /Grace Hopper/ })).toBeVisible();

    await page.getByRole("button", { name: "Edit Grace Hopper" }).click();
    await expect(
      page.getByRole("heading", { name: "Edit contact" })
    ).toBeVisible();
    await page.getByLabel("Phone").fill("555-0199");
    await page.getByRole("button", { name: "Save contact" }).click();

    const row = page.getByRole("row", { name: /Grace Hopper/ });
    await expect(row).toContainText("555-0199");

    await page.reload();
    await expect(page.getByRole("row", { name: /Grace Hopper/ })).toContainText(
      "555-0199"
    );
  });

  test("user can delete a contact", async ({ page }) => {
    await page.goto("/contacts/");
    await page.getByLabel("First name").fill("Del");
    await page.getByLabel("Last name").fill("Eted");
    await page.getByLabel("Email").fill("del@example.com");
    await page.getByRole("button", { name: "Add contact" }).click();
    await expect(page.getByRole("row", { name: /Del Eted/ })).toBeVisible();

    await page.getByRole("button", { name: "Delete Del Eted" }).click();
    await expect(page.getByRole("row", { name: /Del Eted/ })).toBeHidden();

    await page.reload();
    await expect(page.getByRole("row", { name: /Del Eted/ })).toBeHidden();
  });
});
