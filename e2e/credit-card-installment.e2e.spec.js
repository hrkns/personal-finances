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

async function createInstallmentWithRetry(page, installmentForm, concept) {
  const message = page.locator("#credit-card-installment-form-message");
  const tableBody = page.locator("#credit-card-installments-body");

  for (let attempt = 0; attempt < 2; attempt += 1) {
    await installmentForm.getByRole("button", { name: "Create" }).click();

    try {
      await expect(message).toHaveText("Credit card installment created", { timeout: 4000 });
      return;
    } catch (_error) {
      const tableText = (await tableBody.textContent()) || "";
      if (tableText.includes(concept)) {
        return;
      }

      const statusText = ((await message.textContent()) || "").trim();
      if (statusText !== "Failed to fetch" || attempt === 1) {
        await expect(message).toHaveText("Credit card installment created");
      }
    }
  }
}

test("credit card installment CRUD flow works end-to-end", async ({ page }) => {
  const suffix = uniqueSuffix();
  const bankName = `Installment Bank ${suffix}`;
  const personName = `Installment Person ${suffix}`;
  const cardNumber = `INST-${suffix}`;
  const concept = `Laptop ${suffix}`;
  const updatedConcept = `Laptop Updated ${suffix}`;

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
  await creditCardForm.getByLabel("Name").fill("Installments Card");
  await creditCardForm.getByRole("button", { name: "Create" }).click();
  await expect(page.locator("#credit-card-form-message")).toHaveText("Credit card created");

  await page.locator('[data-credit-card-tab="installments"]').click();

  const installmentForm = page.locator("#credit-card-installment-form");
  await selectOptionContaining(installmentForm.getByLabel("Credit Card"), cardNumber);
  await installmentForm.getByLabel("Concept").fill(concept);
  await installmentForm.getByLabel("Amount").fill("350.75");
  await installmentForm.getByLabel("Start Date").fill("2026-02-20");
  await installmentForm.getByLabel("Count").fill("12");
  await createInstallmentWithRetry(page, installmentForm, concept);

  await expect(page.locator("#credit-card-installments-body")).toContainText(concept);
  await expect(page.locator("#credit-card-installments-body")).toContainText("350.75");
  await expect(page.locator("#credit-card-installments-body")).toContainText("2026-02-20");
  await expect(page.locator("#credit-card-installments-body")).toContainText("12");

  const createdRow = page.locator("#credit-card-installments-body tr", { hasText: concept });
  await createdRow.locator('button[data-action="edit"]').click();
  await expect(page.locator("#credit-card-installment-submit-button")).toHaveText("Update");

  await installmentForm.getByLabel("Concept").fill(updatedConcept);
  await installmentForm.getByLabel("Amount").fill("410");
  await installmentForm.getByLabel("Count").fill("10");
  await installmentForm.getByRole("button", { name: "Update" }).click();

  await expect(page.locator("#credit-card-installment-form-message")).toHaveText("Credit card installment updated");
  await expect(page.locator("#credit-card-installments-body")).toContainText(updatedConcept);
  await expect(page.locator("#credit-card-installments-body")).toContainText("410");
  await expect(page.locator("#credit-card-installments-body")).toContainText("10");

  const updatedRow = page.locator("#credit-card-installments-body tr", { hasText: updatedConcept });
  await updatedRow.locator('button[data-action="delete"]').click();

  await expect(page.locator("#credit-card-installment-form-message")).toHaveText("Credit card installment deleted");
  await expect(page.locator("#credit-card-installments-body")).not.toContainText(updatedConcept);
});

test("duplicate credit card installment concept per card is blocked", async ({ page }) => {
  const suffix = uniqueSuffix();
  const bankName = `Installment Dup Bank ${suffix}`;
  const personName = `Installment Dup Person ${suffix}`;
  const cardNumber = `INST-DUP-${suffix}`;
  const concept = `Phone ${suffix}`;

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
  await creditCardForm.getByRole("button", { name: "Create" }).click();
  await expect(page.locator("#credit-card-form-message")).toHaveText("Credit card created");

  await page.locator('[data-credit-card-tab="installments"]').click();

  const installmentForm = page.locator("#credit-card-installment-form");
  await selectOptionContaining(installmentForm.getByLabel("Credit Card"), cardNumber);
  await installmentForm.getByLabel("Concept").fill(concept);
  await installmentForm.getByLabel("Amount").fill("99.99");
  await installmentForm.getByLabel("Start Date").fill("2026-02-01");
  await installmentForm.getByLabel("Count").fill("5");
  await installmentForm.getByRole("button", { name: "Create" }).click();
  await expect(page.locator("#credit-card-installment-form-message")).toHaveText("Credit card installment created");

  await selectOptionContaining(installmentForm.getByLabel("Credit Card"), cardNumber);
  await installmentForm.getByLabel("Concept").fill(concept);
  await installmentForm.getByLabel("Amount").fill("200");
  await installmentForm.getByLabel("Start Date").fill("2026-03-01");
  await installmentForm.getByLabel("Count").fill("2");
  await installmentForm.getByRole("button", { name: "Create" }).click();

  await expect(page.locator("#credit-card-installment-form-message")).toHaveText(
    "A credit card installment with this concept already exists for the selected credit card"
  );
  await expect(page.locator("#credit-card-installment-form-message")).toHaveClass(/error/);
});