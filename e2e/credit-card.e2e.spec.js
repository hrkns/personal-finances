const { test, expect } = require("@playwright/test");
const { openSettingsSection } = require("./helpers");

function uniqueSuffix() {
  return `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

function uniqueCurrencyCode(prefix) {
  return `${prefix}${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
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

test("credit card CRUD flow works end-to-end", async ({ page }) => {
  const suffix = uniqueSuffix();
  const bankName = `Card Bank ${suffix}`;
  const personName = `Card Person ${suffix}`;
  const usdName = `Card USD ${suffix}`;
  const usdCode = uniqueCurrencyCode("U");
  const eurName = `Card EUR ${suffix}`;
  const eurCode = uniqueCurrencyCode("E");
  const initialNumber = `CARD-${suffix}`;
  const updatedNumber = `CARD-U-${suffix}`;

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
  await currencyForm.getByLabel("Name").fill(usdName);
  await currencyForm.getByLabel("Code").fill(usdCode);
  await currencyForm.getByRole("button", { name: "Create" }).click();
  await expect(page.locator("#form-message")).toHaveText("Currency created");

  await currencyForm.getByLabel("Name").fill(eurName);
  await currencyForm.getByLabel("Code").fill(eurCode);
  await currencyForm.getByRole("button", { name: "Create" }).click();
  await expect(page.locator("#form-message")).toHaveText("Currency created");

  await page.getByRole("button", { name: "Credit Cards" }).click();
  const creditCardForm = page.locator("#credit-card-form");
  await creditCardForm.getByLabel("Bank").selectOption({ label: `${bankName} (US)` });
  await selectOptionContaining(creditCardForm.getByLabel("Person"), personName);
  await creditCardForm.getByLabel("Number").fill(initialNumber);
  await creditCardForm.getByLabel("Name").fill("Main Card");
  await creditCardForm.getByLabel("Currencies").selectOption([{ label: `${usdCode} - ${usdName}` }]);
  await creditCardForm.getByRole("button", { name: "Create" }).click();

  await expect(page.locator("#credit-card-form-message")).toHaveText("Credit card created");
  await expect(page.locator("#credit-cards-body")).toContainText(initialNumber);
  await expect(page.locator("#credit-cards-body")).toContainText(usdCode);

  const createdRow = page.locator("#credit-cards-body tr", { hasText: initialNumber });
  const manageCurrenciesButton = createdRow.locator('button[data-action="manage-currencies"]');
  const createdCreditCardID = await manageCurrenciesButton.getAttribute("data-id");
  expect(createdCreditCardID).toBeTruthy();
  await manageCurrenciesButton.click();

  const currencySelector = page.locator(
    `select[data-role="currency-select"][data-credit-card-id="${createdCreditCardID}"]`
  );
  await currencySelector.selectOption([
    { label: `${usdCode} - ${usdName}` },
    { label: `${eurCode} - ${eurName}` },
  ]);
  await page.locator(`button[data-action="save-currencies"][data-id="${createdCreditCardID}"]`).click();

  await expect(page.locator("#credit-card-form-message")).toHaveText("Credit card currencies updated");
  await expect(page.locator("#credit-cards-body")).toContainText(usdCode);
  await expect(page.locator("#credit-cards-body")).toContainText(eurCode);

  const initialRow = page.locator("#credit-cards-body tr", { hasText: initialNumber });
  await initialRow.locator('button[data-action="edit"]').click();
  await expect(page.locator("#credit-card-submit-button")).toHaveText("Update");

  await creditCardForm.getByLabel("Number").fill(updatedNumber);
  await creditCardForm.getByLabel("Name").fill("Updated Card");
  await creditCardForm.getByRole("button", { name: "Update" }).click();

  await expect(page.locator("#credit-card-form-message")).toHaveText("Credit card updated");
  await expect(page.locator("#credit-cards-body")).toContainText(updatedNumber);
  await expect(page.locator("#credit-cards-body")).toContainText("Updated Card");

  const updatedRow = page.locator("#credit-cards-body tr", { hasText: updatedNumber });
  await updatedRow.locator('button[data-action="delete"]').click();

  await expect(page.locator("#credit-card-form-message")).toHaveText("Credit card deleted");
  await expect(page.locator("#credit-cards-body")).not.toContainText(updatedNumber);
});

test("duplicate credit card number shows backend conflict message", async ({ page }) => {
  const suffix = uniqueSuffix();
  const bankName = `Dup Card Bank ${suffix}`;
  const personName = `Dup Card Person ${suffix}`;
  const duplicatedNumber = `DUP-${suffix}`;

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
  const creditCardForm = page.locator("#credit-card-form");
  await creditCardForm.getByLabel("Bank").selectOption({ label: `${bankName} (US)` });
  await selectOptionContaining(creditCardForm.getByLabel("Person"), personName);
  await creditCardForm.getByLabel("Number").fill(duplicatedNumber);
  await creditCardForm.getByRole("button", { name: "Create" }).click();

  await expect(page.locator("#credit-card-form-message")).toHaveText("Credit card created");

  await creditCardForm.getByLabel("Bank").selectOption({ label: `${bankName} (US)` });
  await selectOptionContaining(creditCardForm.getByLabel("Person"), personName);
  await creditCardForm.getByLabel("Number").fill(duplicatedNumber);
  await creditCardForm.getByRole("button", { name: "Create" }).click();

  await expect(page.locator("#credit-card-form-message")).toHaveText("credit card number must be unique");
  await expect(page.locator("#credit-card-form-message")).toHaveClass(/error/);
});
