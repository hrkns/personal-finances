const { test, expect } = require("@playwright/test");
const { openApp, openSettingsSection, uniqueCurrencyCode } = require("./helpers");

function uniqueSuffix() {
  return `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

test("currency CRUD flow works end-to-end", async ({ page }) => {
  const suffix = uniqueSuffix();
  const initialName = `Currency ${suffix}`;
  const updatedName = `Currency Updated ${suffix}`;
  const initialCode = uniqueCurrencyCode("C");
  const updatedCode = uniqueCurrencyCode("U");
  const currencyForm = page.locator("#currency-form");

  await openApp(page);
  await openSettingsSection(page, "Currency");

  await currencyForm.getByLabel("Name").fill(initialName);
  await currencyForm.getByLabel("Code").fill(initialCode);
  await currencyForm.getByRole("button", { name: "Create" }).click();

  await expect(page.locator("#form-message")).toHaveText("Currency created");
  await expect(page.locator("#currencies-body")).toContainText(initialName);
  await expect(page.locator("#currencies-body")).toContainText(initialCode);

  const initialRow = page.locator("#currencies-body tr", { hasText: initialName });
  await initialRow.locator('button[data-action="edit"]').click();
  await expect(page.locator("#submit-button")).toHaveText("Update");

  await currencyForm.getByLabel("Name").fill(updatedName);
  await currencyForm.getByLabel("Code").fill(updatedCode);
  await currencyForm.getByRole("button", { name: "Update" }).click();

  await expect(page.locator("#form-message")).toHaveText("Currency updated");
  await expect(page.locator("#currencies-body")).toContainText(updatedName);
  await expect(page.locator("#currencies-body")).toContainText(updatedCode);

  const updatedRow = page.locator("#currencies-body tr", { hasText: updatedName });
  await updatedRow.locator('button[data-action="delete"]').click();
  await expect(page.locator("#form-message")).toHaveText("Currency deleted");
  await expect(page.locator("#currencies-body")).not.toContainText(updatedName);
});

test("duplicate currency shows backend conflict message", async ({ page }) => {
  const suffix = uniqueSuffix();
  const name = `Duplicate ${suffix}`;
  const code = uniqueCurrencyCode("D");
  const currencyForm = page.locator("#currency-form");

  await openApp(page);
  await openSettingsSection(page, "Currency");

  await currencyForm.getByLabel("Name").fill(name);
  await currencyForm.getByLabel("Code").fill(code);
  await currencyForm.getByRole("button", { name: "Create" }).click();
  await expect(page.locator("#form-message")).toHaveText("Currency created");

  await currencyForm.getByLabel("Name").fill(name);
  await currencyForm.getByLabel("Code").fill(code);
  await currencyForm.getByRole("button", { name: "Create" }).click();

  await expect(page.locator("#form-message")).toHaveText("name and code must be unique");
  await expect(page.locator("#form-message")).toHaveClass(/error/);
});
