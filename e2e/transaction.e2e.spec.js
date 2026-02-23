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

test("transaction CRUD flow works end-to-end", async ({ page }) => {
  const suffix = uniqueSuffix();
  const personName = `Transaction Person ${suffix}`;
  const categoryName = `Transaction Category ${suffix}`;
  const currencyName = `Transaction Currency ${suffix}`;
  const currencyCode = uniqueCurrencyCode("T");
  const bankName = `Transaction Bank ${suffix}`;
  const accountNumber = `TX-${suffix}`;

  await page.goto("/");
  await waitForAppReady(page);

  await openSettingsSection(page, "People");
  const peopleForm = page.locator("#people-form");
  await peopleForm.getByLabel("Name").fill(personName);
  await peopleForm.getByRole("button", { name: "Create" }).click();
  await expect(page.locator("#person-form-message")).toHaveText("Person created");

  await openSettingsSection(page, "Transaction Categories");
  const categoryForm = page.locator("#transaction-category-form");
  await categoryForm.getByLabel("Name").fill(categoryName);
  await categoryForm.getByRole("button", { name: "Create" }).click();
  await expect(page.locator("#transaction-category-form-message")).toHaveText("Transaction category created");

  await openSettingsSection(page, "Currency");
  const currencyForm = page.locator("#currency-form");
  await currencyForm.getByLabel("Name").fill(currencyName);
  await currencyForm.getByLabel("Code").fill(currencyCode);
  await currencyForm.getByRole("button", { name: "Create" }).click();
  await expect(page.locator("#form-message")).toHaveText("Currency created");

  await openSettingsSection(page, "Banks");
  const bankForm = page.locator("#bank-form");
  await bankForm.getByLabel("Name").fill(bankName);
  await bankForm.getByLabel("Country").selectOption("US");
  await bankForm.getByRole("button", { name: "Create" }).click();
  await expect(page.locator("#bank-form-message")).toHaveText("Bank created");

  await openSettingsSection(page, "Bank Accounts");
  const bankAccountForm = page.locator("#bank-account-form");
  await bankAccountForm.getByLabel("Bank").selectOption({ label: `${bankName} (US)` });
  await bankAccountForm.getByLabel("Currency").selectOption({ label: `${currencyCode} - ${currencyName}` });
  await bankAccountForm.getByLabel("Account Number").fill(accountNumber);
  await bankAccountForm.getByLabel("Balance").fill("100");
  await bankAccountForm.getByRole("button", { name: "Create" }).click();
  await expect(page.locator("#bank-account-form-message")).toHaveText("Bank account created");

  await page.getByRole("button", { name: "Transactions" }).click();
  const transactionForm = page.locator("#transaction-form");
  await transactionForm.getByLabel("Date").fill("2026-02-18");
  await transactionForm.getByLabel("Type").selectOption("income");
  await transactionForm.getByLabel("Amount").fill("1200.50");
  await selectOptionContaining(transactionForm.getByLabel("Person"), personName);
  await selectOptionContaining(transactionForm.getByLabel("Bank Account"), accountNumber);
  await selectOptionContaining(transactionForm.getByLabel("Category"), categoryName);
  await transactionForm.getByLabel("Notes").fill("Salary payment");
  await transactionForm.getByRole("button", { name: "Create" }).click();

  await expect(page.locator("#transaction-form-message")).toHaveText("Transaction created");
  await expect(page.locator("#transactions-body")).toContainText("2026-02-18");
  await expect(page.locator("#transactions-body")).toContainText("income");
  await expect(page.locator("#transactions-body")).toContainText("Salary payment");

  const createdRow = page.locator("#transactions-body tr", { hasText: "2026-02-18" });
  await createdRow.locator('button[data-action="edit"]').click();
  await expect(page.locator("#transaction-submit-button")).toHaveText("Update");

  await transactionForm.getByLabel("Type").selectOption("expense");
  await transactionForm.getByLabel("Amount").fill("25.75");
  await transactionForm.getByLabel("Notes").fill("Lunch");
  await transactionForm.getByRole("button", { name: "Update" }).click();

  await expect(page.locator("#transaction-form-message")).toHaveText("Transaction updated");
  await expect(page.locator("#transactions-body")).toContainText("expense");
  await expect(page.locator("#transactions-body")).toContainText("25.75");
  await expect(page.locator("#transactions-body")).toContainText("Lunch");

  const updatedRow = page.locator("#transactions-body tr", { hasText: "Lunch" });
  await updatedRow.locator('button[data-action="delete"]').click();

  await expect(page.locator("#transaction-form-message")).toHaveText("Transaction deleted");
  await expect(page.locator("#transactions-body")).not.toContainText("Lunch");
});
