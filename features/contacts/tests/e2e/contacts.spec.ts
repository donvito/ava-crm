import { expect, test } from "@playwright/test";

test("user can create a contact linked to a company", async ({ page }) => {
  await page.goto("/contacts");

  await expect(page.getByRole("heading", { name: "Contacts" })).toBeVisible();

  const firstName = "Nora";
  const lastName = `Quill${Date.now()}`;

  await page.getByLabel("First name").fill(firstName);
  await page.getByLabel("Last name").fill(lastName);
  await page.getByLabel("Email").fill("nora@example.com");
  await page.getByLabel("Company").selectOption({ label: "Fixture Co" });
  await page.getByRole("button", { name: "Create contact" }).click();

  await expect(page.getByText(`${firstName} ${lastName}`)).toBeVisible();
  await expect(page.getByRole("row", { name: new RegExp(lastName) })).toContainText(
    "Fixture Co",
  );

  await page.reload();
  await expect(page.getByText(`${firstName} ${lastName}`)).toBeVisible();
});
