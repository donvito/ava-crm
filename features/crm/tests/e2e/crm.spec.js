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

  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("First name", { exact: false }).fill("Avery");
  await dialog.getByLabel("Last name", { exact: false }).fill("Stone");
  await dialog
    .getByLabel("Work email", { exact: false })
    .fill("avery@harborandpine.com");
  await dialog.getByLabel("Company", { exact: false }).fill("Harbor & Pine");
  await dialog.getByLabel("Role").fill("Partnerships lead");
  await dialog.getByLabel("City").fill("Boston");
  await dialog
    .getByRole("combobox", { name: "Relationship", exact: true })
    .selectOption("Prospect");
  await dialog
    .getByRole("button", { name: "Add contact", exact: true })
    .click();

  await expect(page.getByText("Contact added")).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: /Avery Stone avery@harborandpine\.com/,
    }),
  ).toBeVisible();

  await page.reload();
  await page.getByRole("searchbox", { name: "Search contacts" }).fill("Harbor");

  await expect(
    page.getByRole("button", {
      name: /Avery Stone avery@harborandpine\.com/,
    }),
  ).toBeVisible();
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

  const dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Deal name", { exact: false })
    .fill("Expansion partnership");
  await dialog.getByLabel("Primary contact").selectOption({
    label: "Olivia Martin · Northstar Studio",
  });
  await dialog.getByLabel("Deal value", { exact: false }).fill("64000");
  await dialog
    .getByRole("combobox", { name: "Stage", exact: true })
    .selectOption("Qualified");
  await dialog.getByRole("button", { name: "Create deal" }).click();

  await expect(page.getByText("Deal created")).toBeVisible();

  const stageSelect = page.getByLabel(
    "Move Expansion partnership to stage",
  );
  await expect(stageSelect).toBeVisible();
  await stageSelect.selectOption("Proposal");
  await expect(page.getByText("Stage updated")).toBeVisible();
  await expect(stageSelect).toHaveValue("Proposal");

  await page.reload();
  await expect(
    page.getByLabel("Move Expansion partnership to stage"),
  ).toHaveValue("Proposal");
  expect(browserErrors).toEqual([]);
});
