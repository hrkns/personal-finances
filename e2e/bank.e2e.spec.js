const { test, expect } = require("@playwright/test");
const { openSettingsSection } = require("./helpers");

function uniqueSuffix() {
  return `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

test("bank CRUD flow works end-to-end", async ({ page }) => {
  const suffix = uniqueSuffix();
  const initialName = `Bank ${suffix}`;
  const updatedName = `Bank Updated ${suffix}`;
  const bankForm = page.locator("#bank-form");

  await page.goto("/");
  await openSettingsSection(page, "Banks");

  await bankForm.getByLabel("Name").fill(initialName);
  await bankForm.getByLabel("Country").selectOption("US");
  await bankForm.getByRole("button", { name: "Create" }).click();

  await expect(page.locator("#bank-form-message")).toHaveText("Bank created");
  await expect(page.locator("#banks-body")).toContainText(initialName);
  await expect(page.locator("#banks-body")).toContainText("US");

  const initialRow = page.locator("#banks-body tr", { hasText: initialName });
  await initialRow.locator('button[data-action="edit"]').click();
  await expect(page.locator("#bank-submit-button")).toHaveText("Update");

  await bankForm.getByLabel("Name").fill(updatedName);
  await bankForm.getByLabel("Country").selectOption("CA");
  await bankForm.getByRole("button", { name: "Update" }).click();

  await expect(page.locator("#bank-form-message")).toHaveText("Bank updated");
  await expect(page.locator("#banks-body")).toContainText(updatedName);
  await expect(page.locator("#banks-body")).toContainText("CA");

  const updatedRow = page.locator("#banks-body tr", { hasText: updatedName });
  await updatedRow.locator('button[data-action="delete"]').click();
  await expect(page.locator("#bank-form-message")).toHaveText("Bank deleted");
  await expect(page.locator("#banks-body")).not.toContainText(updatedName);
});

test("duplicate bank per country shows backend conflict message", async ({ page }) => {
  const suffix = uniqueSuffix();
  const name = `Duplicate Bank ${suffix}`;
  const bankForm = page.locator("#bank-form");

  await page.goto("/");
  await openSettingsSection(page, "Banks");

  await bankForm.getByLabel("Name").fill(name);
  await bankForm.getByLabel("Country").selectOption("US");
  await bankForm.getByRole("button", { name: "Create" }).click();
  await expect(page.locator("#bank-form-message")).toHaveText("Bank created");

  await bankForm.getByLabel("Name").fill(name);
  await bankForm.getByLabel("Country").selectOption("US");
  await bankForm.getByRole("button", { name: "Create" }).click();

  await expect(page.locator("#bank-form-message")).toHaveText("name and country combination must be unique");
  await expect(page.locator("#bank-form-message")).toHaveClass(/error/);
});
