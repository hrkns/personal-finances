const { test, expect } = require("@playwright/test");
const { openApp } = require("./helpers");

function uniqueSuffix() {
  return `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

test("expense CRUD flow works end-to-end", async ({ page }) => {
  const suffix = uniqueSuffix();
  const initialName = `Expense ${suffix}`;
  const updatedName = `Expense Updated ${suffix}`;
  const expenseForm = page.locator("#expense-form");

  await openApp(page);
  await page.getByRole("button", { name: "Expenses" }).click();
  await page.getByRole("button", { name: "List of expenses" }).click();

  await page.getByRole("button", { name: "Create expense" }).click();

  await expenseForm.getByLabel("Name").fill(initialName);
  await expenseForm.getByLabel("Frequency").selectOption("monthly");
  await expenseForm.getByRole("button", { name: "Create" }).click();

  await expect(page.locator("#expense-form-message")).toHaveText("Expense created");
  await expect(page.locator("#expenses-body")).toContainText(initialName);
  await expect(page.locator("#expenses-body")).toContainText("monthly");

  const initialRow = page.locator("#expenses-body tr", { hasText: initialName });
  await initialRow.locator('button[data-action="edit"]').click();
  await expect(page.locator("#expense-submit-button")).toHaveText("Update");

  await expenseForm.getByLabel("Name").fill(updatedName);
  await expenseForm.getByLabel("Frequency").selectOption("weekly");
  await expenseForm.getByRole("button", { name: "Update" }).click();

  await expect(page.locator("#expense-form-message")).toHaveText("Expense updated");
  await expect(page.locator("#expenses-body")).toContainText(updatedName);
  await expect(page.locator("#expenses-body")).toContainText("weekly");

  const updatedRow = page.locator("#expenses-body tr", { hasText: updatedName });
  await updatedRow.locator('button[data-action="delete"]').click();

  await expect(page.locator("#expense-form-message")).toHaveText("Expense deleted");
  await expect(page.locator("#expenses-body")).not.toContainText(updatedName);
});

test("duplicate expense name shows backend conflict message", async ({ page }) => {
  const suffix = uniqueSuffix();
  const name = `Duplicate Expense ${suffix}`;
  const expenseForm = page.locator("#expense-form");

  await openApp(page);
  await page.getByRole("button", { name: "Expenses" }).click();
  await page.getByRole("button", { name: "List of expenses" }).click();

  await page.getByRole("button", { name: "Create expense" }).click();

  await expenseForm.getByLabel("Name").fill(name);
  await expenseForm.getByLabel("Frequency").selectOption("monthly");
  await expenseForm.getByRole("button", { name: "Create" }).click();
  await expect(page.locator("#expense-form-message")).toHaveText("Expense created");

  await page.getByRole("button", { name: "Create expense" }).click();

  await expenseForm.getByLabel("Name").fill(name);
  await expenseForm.getByLabel("Frequency").selectOption("annually");
  await expenseForm.getByRole("button", { name: "Create" }).click();

  await expect(page.locator("#expense-form-message")).toHaveText("expense name must be unique");
  await expect(page.locator("#expense-form-message")).toHaveClass(/error/);
});
