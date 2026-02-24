const { test, expect } = require("@playwright/test");
const { openSettingsSection } = require("./helpers");

function uniqueSuffix() {
  return `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

async function waitForAppReady(page) {
  await page.waitForFunction(() => typeof window.frontendRouter !== "undefined");
}

async function selectOptionContaining(selectLocator, expectedText) {
  const value = await selectLocator.evaluate((element, text) => {
    const option = [...element.options].find((item) => (item.textContent || "").includes(text));
    return option ? option.value : null;
  }, expectedText);

  expect(value).toBeTruthy();
  await selectLocator.selectOption(value);
}

test("credit card cycle CRUD flow works end-to-end", async ({ page }) => {
  const suffix = uniqueSuffix();
  const bankName = `Cycle Bank ${suffix}`;
  const personName = `Cycle Person ${suffix}`;
  const cardNumber = `CYCLE-${suffix}`;

  await page.goto("/");
  await waitForAppReady(page);

  await openSettingsSection(page, "Banks");
  const bankForm = page.locator("#bank-form");
  await bankForm.getByLabel("Name").fill(bankName);
  await bankForm.getByLabel("Country").selectOption("US");
  await bankForm.getByRole("button", { name: "Create" }).click();
  await expect(page.locator("#bank-form-message")).toHaveText("Bank created");

  await openSettingsSection(page, "People");
  const peopleForm = page.locator("#people-form");
  await peopleForm.getByLabel("Name").fill(personName);
  await peopleForm.getByRole("button", { name: "Create" }).click();
  await expect(page.locator("#person-form-message")).toHaveText("Person created");

  await page.getByRole("button", { name: "Credit Cards" }).click();
  await page.locator('[data-credit-card-tab="cards"]').click();

  const creditCardForm = page.locator("#credit-card-form");
  await creditCardForm.getByLabel("Bank").selectOption({ label: `${bankName} (US)` });
  await selectOptionContaining(creditCardForm.getByLabel("Person"), personName);
  await creditCardForm.getByLabel("Number").fill(cardNumber);
  await creditCardForm.getByLabel("Name").fill("Cycle Card");
  await creditCardForm.getByRole("button", { name: "Create" }).click();

  await expect(page.locator("#credit-card-form-message")).toHaveText("Credit card created");
  await expect(page.locator("#credit-cards-body")).toContainText(cardNumber);

  await page.locator('[data-credit-card-tab="cycles"]').click();

  const cycleForm = page.locator("#credit-card-cycle-form");
  await selectOptionContaining(cycleForm.getByLabel("Credit Card"), cardNumber);
  await cycleForm.getByLabel("Closing Date").fill("2026-03-20");
  await cycleForm.getByLabel("Due Date").fill("2026-03-30");
  await cycleForm.getByRole("button", { name: "Create" }).click();

  await expect(page.locator("#credit-card-cycle-form-message")).toHaveText("Credit card cycle created");
  await expect(page.locator("#credit-card-cycles-body")).toContainText("2026-03-20");
  await expect(page.locator("#credit-card-cycles-body")).toContainText("2026-03-30");

  const initialRow = page.locator("#credit-card-cycles-body tr", { hasText: "2026-03-20" });
  await initialRow.locator('button[data-action="edit"]').click();
  await expect(page.locator("#credit-card-cycle-submit-button")).toHaveText("Update");

  await cycleForm.getByLabel("Closing Date").fill("2026-04-20");
  await cycleForm.getByLabel("Due Date").fill("2026-04-30");
  await cycleForm.getByRole("button", { name: "Update" }).click();

  await expect(page.locator("#credit-card-cycle-form-message")).toHaveText("Credit card cycle updated");
  await expect(page.locator("#credit-card-cycles-body")).toContainText("2026-04-20");

  const updatedRow = page.locator("#credit-card-cycles-body tr", { hasText: "2026-04-20" });
  await updatedRow.locator('button[data-action="delete"]').click();

  await expect(page.locator("#credit-card-cycle-form-message")).toHaveText("Credit card cycle deleted");
  await expect(page.locator("#credit-card-cycles-body")).not.toContainText("2026-04-20");
});

test("credit card cycle validates due date is on or after closing date", async ({ page }) => {
  const suffix = uniqueSuffix();
  const bankName = `Cycle Validation Bank ${suffix}`;
  const personName = `Cycle Validation Person ${suffix}`;
  const cardNumber = `CYCLE-V-${suffix}`;

  await page.goto("/");
  await waitForAppReady(page);

  await openSettingsSection(page, "Banks");
  const bankForm = page.locator("#bank-form");
  await bankForm.getByLabel("Name").fill(bankName);
  await bankForm.getByLabel("Country").selectOption("US");
  await bankForm.getByRole("button", { name: "Create" }).click();
  await expect(page.locator("#bank-form-message")).toHaveText("Bank created");

  await openSettingsSection(page, "People");
  const peopleForm = page.locator("#people-form");
  await peopleForm.getByLabel("Name").fill(personName);
  await peopleForm.getByRole("button", { name: "Create" }).click();
  await expect(page.locator("#person-form-message")).toHaveText("Person created");

  await page.getByRole("button", { name: "Credit Cards" }).click();
  await page.locator('[data-credit-card-tab="cards"]').click();

  const creditCardForm = page.locator("#credit-card-form");
  await creditCardForm.getByLabel("Bank").selectOption({ label: `${bankName} (US)` });
  await selectOptionContaining(creditCardForm.getByLabel("Person"), personName);
  await creditCardForm.getByLabel("Number").fill(cardNumber);
  await creditCardForm.getByLabel("Name").fill("Validation Card");
  await creditCardForm.getByRole("button", { name: "Create" }).click();
  await expect(page.locator("#credit-card-form-message")).toHaveText("Credit card created");

  await page.locator('[data-credit-card-tab="cycles"]').click();

  const cycleForm = page.locator("#credit-card-cycle-form");
  await selectOptionContaining(cycleForm.getByLabel("Credit Card"), cardNumber);
  await cycleForm.getByLabel("Closing Date").fill("2026-08-20");
  await cycleForm.getByLabel("Due Date").fill("2026-08-10");
  await cycleForm.getByRole("button", { name: "Create" }).click();

  await expect(page.locator("#credit-card-cycle-form-message")).toHaveText("due_date must be on or after closing_date");
  await expect(page.locator("#credit-card-cycle-form-message")).toHaveClass(/error/);
  await expect(page.locator("#credit-card-cycles-body")).toContainText("No credit card cycles yet");
});
