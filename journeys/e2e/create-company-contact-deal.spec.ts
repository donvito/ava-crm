import { expect, test } from "@playwright/test";

test("user can create company, contact, and deal end to end", async ({
  page,
}) => {
  const stamp = Date.now();
  const companyName = `Journey Co ${stamp}`;
  const contactLast = `Lane${stamp}`;
  const dealTitle = `Journey deal ${stamp}`;

  await page.goto("/companies");
  await page.getByLabel("Company name").fill(companyName);
  await page.getByLabel("Industry").fill("Retail");
  await page.getByRole("button", { name: "Create company" }).click();
  await expect(page.getByText(companyName)).toBeVisible();

  await page.getByRole("link", { name: "Contacts" }).click();
  await page.getByLabel("First name").fill("Jules");
  await page.getByLabel("Last name").fill(contactLast);
  await page.getByLabel("Email").fill(`jules${stamp}@example.com`);
  await page.getByLabel("Company").selectOption({ label: companyName });
  await page.getByRole("button", { name: "Create contact" }).click();
  await expect(page.getByText(`Jules ${contactLast}`)).toBeVisible();

  await page.getByRole("link", { name: "Deals" }).click();
  await page.getByLabel("Deal title").fill(dealTitle);
  await page.getByLabel("Value (USD)").fill("9000");
  await page.getByLabel("Company").selectOption({ label: companyName });
  await page.getByLabel("Contact").selectOption({ label: `Jules ${contactLast}` });
  await page.getByRole("button", { name: "Create deal" }).click();
  await expect(page.getByText(dealTitle)).toBeVisible();

  await page.getByRole("link", { name: "Dashboard" }).click();
  await expect(page.getByText(dealTitle)).toBeVisible();
});
