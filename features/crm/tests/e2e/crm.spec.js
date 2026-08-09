import { expect, test } from "@playwright/test";

function captureBrowserErrors(page) {
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

test("dashboard presents live CRM activity from SQLite", async ({ page }) => {
  const browserErrors = captureBrowserErrors(page);
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Good evening, Morgan" }),
  ).toBeVisible();
  await expect(page.getByText("Active contacts")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Pipeline overview" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Recent contacts" })).toBeVisible();
  await expect(page.getByText("Northstar Studio").first()).toBeVisible();
  expect(browserErrors).toEqual([]);
});

test("user can add and find a contact after reloading", async ({ page }) => {
  const browserErrors = captureBrowserErrors(page);
  await page.goto("/contacts");

  await expect(page.getByRole("heading", { name: "Contacts" })).toBeVisible();
  await page.getByRole("button", { name: "Add contact" }).click();

  await page.getByLabel("First name", { exact: false }).fill("Avery");
  await page.getByLabel("Last name", { exact: false }).fill("Stone");
  await page
    .getByLabel("Work email", { exact: false })
    .fill("avery@harborandpine.com");
  await page.getByLabel("Company", { exact: false }).fill("Harbor & Pine");
  await page.getByLabel("Role").fill("Partnerships lead");
  await page.getByLabel("City").fill("Boston");
  await page.getByLabel("Relationship").selectOption("Prospect");
  await page
    .getByRole("button", { name: "Add contact", exact: true })
    .click();

  await expect(page.getByText("Contact added")).toBeVisible();
  await expect(page.getByText("Avery Stone")).toBeVisible();

  await page.reload();
  await page.getByRole("searchbox", { name: "Search contacts" }).fill("Harbor");

  await expect(page.getByText("Avery Stone")).toBeVisible();
  await expect(page.getByText("avery@harborandpine.com")).toBeVisible();
  expect(browserErrors).toEqual([]);
});

test("user can create a deal and persist a pipeline stage change", async ({
  page,
}) => {
  const browserErrors = captureBrowserErrors(page);
  await page.goto("/pipeline");

  await expect(page.getByRole("heading", { name: "Deal pipeline" })).toBeVisible();
  await page.getByRole("button", { name: "New deal" }).click();

  await page.getByLabel("Deal name", { exact: false }).fill("Expansion partnership");
  await page.getByLabel("Primary contact").selectOption({ label: /Olivia Martin/ });
  await page.getByLabel("Deal value", { exact: false }).fill("64000");
  await page.getByLabel("Stage").selectOption("Qualified");
  await page.getByRole("button", { name: "Create deal" }).click();

  await expect(page.getByText("Deal created")).toBeVisible();
  await expect(page.getByText("Expansion partnership")).toBeVisible();

  const stageSelect = page.getByLabel(
    "Move Expansion partnership to stage",
  );
  await stageSelect.selectOption("Proposal");
  await expect(page.getByText("Stage updated")).toBeVisible();
  await expect(stageSelect).toHaveValue("Proposal");

  await page.reload();
  await expect(
    page.getByLabel("Move Expansion partnership to stage"),
  ).toHaveValue("Proposal");
  expect(browserErrors).toEqual([]);
});
