const { test, expect } = require("@playwright/test");
const { openSettingsSection, uniqueCurrencyCode } = require("./helpers");

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

test("credit card subscription CRUD flow works end-to-end", async ({ page }) => {
  const suffix = uniqueSuffix();
  const bankName = `Subscription Bank ${suffix}`;
  const personName = `Subscription Person ${suffix}`;
  const cardNumber = `SUB-${suffix}`;
  const currencyName = `Subscription Currency ${suffix}`;
  const currencyCode = uniqueCurrencyCode("S");

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

  await openSettingsSection(page, "Currency");
  const currencyForm = page.locator("#currency-form");
  await currencyForm.getByLabel("Name").fill(currencyName);
  await currencyForm.getByLabel("Code").fill(currencyCode);
  await currencyForm.getByRole("button", { name: "Create" }).click();
  await expect(page.locator("#form-message")).toHaveText("Currency created");

  await page.getByRole("button", { name: "Credit Cards" }).click();
  await page.locator('[data-credit-card-tab="cards"]').click();

  const creditCardForm = page.locator("#credit-card-form");
  await creditCardForm.getByLabel("Bank").selectOption({ label: `${bankName} (US)` });
  await selectOptionContaining(creditCardForm.getByLabel("Person"), personName);
  await creditCardForm.getByLabel("Number").fill(cardNumber);
  await creditCardForm.getByRole("button", { name: "Create" }).click();
  await expect(page.locator("#credit-card-form-message")).toHaveText("Credit card created");

  await page.locator('[data-credit-card-tab="subscriptions"]').click();

  const subscriptionForm = page.locator("#credit-card-subscription-form");
  await selectOptionContaining(subscriptionForm.getByLabel("Credit Card"), cardNumber);
  await subscriptionForm.getByLabel("Currency").selectOption({ label: `${currencyCode} (${currencyName})` });
  await subscriptionForm.getByLabel("Concept").fill("Streaming Service");
  await subscriptionForm.getByLabel("Amount").fill("19.99");
  await subscriptionForm.getByRole("button", { name: "Create" }).click();

  await expect(page.locator("#credit-card-subscription-form-message")).toHaveText("Credit card subscription created");
  await expect(page.locator("#credit-card-subscriptions-body")).toContainText("Streaming Service");
  await expect(page.locator("#credit-card-subscriptions-body")).toContainText("19.99");

  const createdRow = page.locator("#credit-card-subscriptions-body tr", { hasText: "Streaming Service" });
  await createdRow.locator('button[data-action="edit"]').click();

  await subscriptionForm.getByLabel("Concept").fill("Cloud Storage");
  await subscriptionForm.getByLabel("Amount").fill("9.99");
  await subscriptionForm.getByRole("button", { name: "Update" }).click();

  await expect(page.locator("#credit-card-subscription-form-message")).toHaveText("Credit card subscription updated");
  await expect(page.locator("#credit-card-subscriptions-body")).toContainText("Cloud Storage");

  const updatedRow = page.locator("#credit-card-subscriptions-body tr", { hasText: "Cloud Storage" });
  await updatedRow.locator('button[data-action="delete"]').click();

  await expect(page.locator("#credit-card-subscription-form-message")).toHaveText("Credit card subscription deleted");
  await expect(page.locator("#credit-card-subscriptions-body")).not.toContainText("Cloud Storage");
});
