const { test, expect } = require("@playwright/test");
const { openApp, uniqueCurrencyCode } = require("./helpers");

function uniqueSuffix() {
  return `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

async function createExpense(page, name, frequency) {
  await page.getByRole("button", { name: "Expenses" }).click();
  await page.getByRole("button", { name: "List of expenses" }).click();

  const expenseForm = page.locator("#expense-form");
  await expenseForm.getByLabel("Name").fill(name);
  await expenseForm.getByLabel("Frequency").selectOption(frequency);
  await expenseForm.getByRole("button", { name: "Create" }).click();

  await expect(page.locator("#expense-form-message")).toHaveText("Expense created");
}

async function createCurrency(page, name, code) {
  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByRole("button", { name: "Currency" }).click();

  const currencyForm = page.locator("#currency-form");
  await currencyForm.getByLabel("Name").fill(name);
  await currencyForm.getByLabel("Code").fill(code);
  await currencyForm.getByRole("button", { name: "Create" }).click();

  await expect(page.locator("#form-message")).toHaveText("Currency created");
}

test("expense payment CRUD flow works end-to-end", async ({ page }) => {
  const suffix = uniqueSuffix();
  const expenseName = `Expense ${suffix}`;
  const expenseFrequency = "weekly";
  const currencyName = `US Dollar ${suffix}`;
  const currencyCode = uniqueCurrencyCode("U");

  await openApp(page);
  await createExpense(page, expenseName, expenseFrequency);
  await createCurrency(page, currencyName, currencyCode);

  await page.getByRole("button", { name: "Expenses" }).click();
  await page.getByRole("button", { name: "Payments" }).click();

  const form = page.locator("#expense-payment-form");
  await form.getByLabel("Expense").selectOption(`${expenseName} (${expenseFrequency})`);
  await form.getByLabel("Amount").fill("45.70");
  await form.getByLabel("Currency").selectOption(`${currencyCode} (${currencyName})`);
  await form.getByLabel("Date").fill("2026-03-16");
  await form.getByRole("button", { name: "Create" }).click();

  await expect(page.locator("#expense-payment-form-message")).toHaveText("Expense payment created");
  await expect(page.locator("#expense-payments-body")).toContainText("45.70");
  await expect(page.locator("#expense-payments-body")).toContainText("2026-03-16");

  const row = page.locator("#expense-payments-body tr").first();
  await row.locator('button[data-action="edit"]').click();
  await expect(page.locator("#expense-payment-submit-button")).toHaveText("Update");

  await form.getByLabel("Amount").fill("49.90");
  await form.getByLabel("Date").fill("2026-03-23");
  await form.getByRole("button", { name: "Update" }).click();

  await expect(page.locator("#expense-payment-form-message")).toHaveText("Expense payment updated");
  await expect(page.locator("#expense-payments-body")).toContainText("49.90");
  await expect(page.locator("#expense-payments-body")).toContainText("2026-03-23");

  await row.locator('button[data-action="delete"]').click();
  await expect(page.locator("#expense-payment-form-message")).toHaveText("Expense payment deleted");
  await expect(page.locator("#expense-payments-body")).toContainText("No expense payments yet");
});

test("expense payment duplicate period is blocked", async ({ page }) => {
  const suffix = uniqueSuffix();
  const expenseName = `Monthly Expense ${suffix}`;
  const expenseFrequency = "monthly";
  const currencyName = `Euro ${suffix}`;
  const currencyCode = uniqueCurrencyCode("E");

  await openApp(page);
  await createExpense(page, expenseName, expenseFrequency);
  await createCurrency(page, currencyName, currencyCode);

  await page.getByRole("button", { name: "Expenses" }).click();
  await page.getByRole("button", { name: "Payments" }).click();

  const form = page.locator("#expense-payment-form");

  await form.getByLabel("Expense").selectOption(`${expenseName} (${expenseFrequency})`);
  await form.getByLabel("Amount").fill("100");
  await form.getByLabel("Currency").selectOption(`${currencyCode} (${currencyName})`);
  await form.getByLabel("Date").fill("2026-03-01");
  await form.getByRole("button", { name: "Create" }).click();
  await expect(page.locator("#expense-payment-form-message")).toHaveText("Expense payment created");

  await form.getByLabel("Expense").selectOption(`${expenseName} (${expenseFrequency})`);
  await form.getByLabel("Amount").fill("120");
  await form.getByLabel("Currency").selectOption(`${currencyCode} (${currencyName})`);
  await form.getByLabel("Date").fill("2026-03-20");
  await form.getByRole("button", { name: "Create" }).click();

  await expect(page.locator("#expense-payment-form-message")).toHaveText("an expense payment already exists in the same monthly period");
  await expect(page.locator("#expense-payment-form-message")).toHaveClass(/error/);
});
