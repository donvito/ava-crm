import { test, expect } from "@playwright/test";

// Cross-feature journey with all real features enabled:
// create a company -> create a contact at that company -> create a deal
// linked to both -> win the deal.
test("new customer journey: company, contact, deal, won", async ({ page }) => {
  // 1. Create a company.
  await page.goto("/companies/");
  await page.getByLabel("Name").fill("Initech");
  await page.getByLabel("Industry").fill("Software");
  await page.getByRole("button", { name: "Add company" }).click();
  await expect(page.getByRole("row", { name: /Initech/ })).toBeVisible();

  // 2. Create a contact at that company via the header nav.
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Contacts" }).click();
  await page.getByLabel("First name").fill("Peter");
  await page.getByLabel("Last name").fill("Gibbons");
  await page.getByLabel("Email").fill("peter@initech.com");
  await page.getByLabel("Company").selectOption({ label: "Initech" });
  await page.getByRole("button", { name: "Add contact" }).click();
  const contactRow = page.getByRole("row", { name: /Peter Gibbons/ });
  await expect(contactRow).toBeVisible();
  await expect(contactRow).toContainText("Initech");

  // 3. Create a deal linked to the real contact and company.
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Deals" }).click();
  await page.getByLabel("Title").fill("TPS software rollout");
  await page.getByLabel("Value (USD)").fill("48000");
  await page.getByLabel("Contact").selectOption({ label: "Peter Gibbons" });
  await page.getByLabel("Company").selectOption({ label: "Initech" });
  await page.getByRole("button", { name: "Add deal" }).click();

  const dealRow = page.getByRole("row", { name: /TPS software rollout/ });
  await expect(dealRow).toBeVisible();
  await expect(dealRow).toContainText("$48,000.00");
  await expect(dealRow).toContainText("Peter Gibbons");
  await expect(dealRow).toContainText("Initech");

  // 4. Win the deal and verify it persists.
  await page.getByLabel("Stage for TPS software rollout").selectOption("won");
  await expect(dealRow.getByText("Won")).toBeVisible();

  await page.reload();
  await expect(
    page.getByRole("row", { name: /TPS software rollout/ }).getByText("Won")
  ).toBeVisible();
});
