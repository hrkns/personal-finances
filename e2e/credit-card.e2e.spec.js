const { test, expect } = require("@playwright/test");
const { openApp, openSettingsSection } = require("./helpers");

function uniqueSuffix() {
  return `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

async function selectOptionContaining(selectLocator, expectedText) {
  const value = await selectLocator.evaluate((element, text) => {
    const option = [...element.options].find((item) => (item.textContent || "").includes(text));
    return option ? option.value : null;
  }, expectedText);

  expect(value).toBeTruthy();
  await selectLocator.selectOption(value);
}

async function updateCreditCardWithRetry(page, creditCardForm, initialNumber, updatedNumber) {
  const message = page.locator("#credit-card-form-message");

  for (let attempt = 0; attempt < 2; attempt += 1) {
    await creditCardForm.getByRole("button", { name: "Update" }).click();

    try {
      await expect(message).toHaveText("Credit card updated", { timeout: 4000 });
      return;
    } catch (_error) {
      const statusText = ((await message.textContent()) || "").trim();
      if (statusText !== "credit card not found" || attempt === 1) {
        await expect(message).toHaveText("Credit card updated");
      }

      const row = page.locator("#credit-cards-body tr", { hasText: initialNumber });
      await row.locator('button[data-action="edit"]').click();
      await expect(page.locator("#credit-card-submit-button")).toHaveText("Update");
      await creditCardForm.getByLabel("Number").fill(updatedNumber);
      await creditCardForm.getByLabel("Name").fill("Updated Card");
    }
  }
}

async function submitExpectSuccessWithRetry(submitAction, messageLocator, successText) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    await submitAction();

    try {
      await expect(messageLocator).toHaveText(successText, { timeout: 4000 });
      return;
    } catch (_error) {
      const statusText = ((await messageLocator.textContent()) || "").trim();
      if (statusText !== "Failed to fetch" || attempt === 1) {
        await expect(messageLocator).toHaveText(successText);
        return;
      }
    }
  }
}

test("credit card CRUD flow works end-to-end", async ({ page }) => {
  const suffix = uniqueSuffix();
  const bankName = `Card Bank ${suffix}`;
  const personName = `Card Person ${suffix}`;
  const initialNumber = `CARD-${suffix}`;
  const updatedNumber = `CARD-U-${suffix}`;

  await openApp(page);

  await openSettingsSection(page, "Banks");
  const bankForm = page.locator("#bank-form");
  await bankForm.getByLabel("Name").fill(bankName);
  await bankForm.getByLabel("Country").selectOption("US");
  await submitExpectSuccessWithRetry(
    () => bankForm.getByRole("button", { name: "Create" }).click(),
    page.locator("#bank-form-message"),
    "Bank created"
  );

  await openSettingsSection(page, "People");
  const peopleForm = page.locator("#people-form");
  await peopleForm.getByLabel("Name").fill(personName);
  await submitExpectSuccessWithRetry(
    () => peopleForm.getByRole("button", { name: "Create" }).click(),
    page.locator("#person-form-message"),
    "Person created"
  );

  await page.getByRole("button", { name: "Credit Cards" }).click();
  const creditCardForm = page.locator("#credit-card-form");
  await creditCardForm.getByLabel("Bank").selectOption({ label: `${bankName} (US)` });
  await selectOptionContaining(creditCardForm.getByLabel("Person"), personName);
  await creditCardForm.getByLabel("Number").fill(initialNumber);
  await creditCardForm.getByLabel("Name").fill("Main Card");
  await submitExpectSuccessWithRetry(
    () => creditCardForm.getByRole("button", { name: "Create" }).click(),
    page.locator("#credit-card-form-message"),
    "Credit card created"
  );
  await expect(page.locator("#credit-cards-body")).toContainText(initialNumber);

  const initialRow = page.locator("#credit-cards-body tr", { hasText: initialNumber });
  await initialRow.locator('button[data-action="edit"]').click();
  await expect(page.locator("#credit-card-submit-button")).toHaveText("Update");

  await creditCardForm.getByLabel("Number").fill(updatedNumber);
  await creditCardForm.getByLabel("Name").fill("Updated Card");
  await updateCreditCardWithRetry(page, creditCardForm, initialNumber, updatedNumber);
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

  await openApp(page);

  await openSettingsSection(page, "Banks");
  const bankForm = page.locator("#bank-form");
  await bankForm.getByLabel("Name").fill(bankName);
  await bankForm.getByLabel("Country").selectOption("US");
  await submitExpectSuccessWithRetry(
    () => bankForm.getByRole("button", { name: "Create" }).click(),
    page.locator("#bank-form-message"),
    "Bank created"
  );

  await openSettingsSection(page, "People");
  const peopleForm = page.locator("#people-form");
  await peopleForm.getByLabel("Name").fill(personName);
  await submitExpectSuccessWithRetry(
    () => peopleForm.getByRole("button", { name: "Create" }).click(),
    page.locator("#person-form-message"),
    "Person created"
  );

  await page.getByRole("button", { name: "Credit Cards" }).click();
  const creditCardForm = page.locator("#credit-card-form");
  await creditCardForm.getByLabel("Bank").selectOption({ label: `${bankName} (US)` });
  await selectOptionContaining(creditCardForm.getByLabel("Person"), personName);
  await creditCardForm.getByLabel("Number").fill(duplicatedNumber);
  await submitExpectSuccessWithRetry(
    () => creditCardForm.getByRole("button", { name: "Create" }).click(),
    page.locator("#credit-card-form-message"),
    "Credit card created"
  );
  await expect(page.locator("#credit-cards-body")).toContainText(duplicatedNumber);

  await creditCardForm.getByLabel("Bank").selectOption({ label: `${bankName} (US)` });
  await selectOptionContaining(creditCardForm.getByLabel("Person"), personName);
  await creditCardForm.getByLabel("Number").fill(duplicatedNumber);
  await creditCardForm.getByRole("button", { name: "Create" }).click();

  await expect(page.locator("#credit-card-form-message")).toHaveText("credit card number must be unique");
  await expect(page.locator("#credit-card-form-message")).toHaveClass(/error/);
});
