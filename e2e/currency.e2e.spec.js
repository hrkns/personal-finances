const { test, expect } = require("@playwright/test");

function uniqueSuffix() {
  return `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

test("currency CRUD flow works end-to-end", async ({ page }) => {
  const suffix = uniqueSuffix();
  const initialName = `Currency ${suffix}`;
  const updatedName = `Currency Updated ${suffix}`;

  await page.goto("/");

  await expect(page.getByText("Backend status: backend is up")).toBeVisible();

  await page.getByLabel("Name").fill(initialName);
  await page.getByLabel("Code").fill("abc");
  await page.getByRole("button", { name: "Create" }).click();

  await expect(page.locator("#form-message")).toHaveText("Currency created");
  await expect(page.locator("#currencies-body")).toContainText(initialName);
  await expect(page.locator("#currencies-body")).toContainText("ABC");

  await page.locator('button[data-action="edit"]').first().click();
  await expect(page.locator("#submit-button")).toHaveText("Update");

  await page.getByLabel("Name").fill(updatedName);
  await page.getByLabel("Code").fill("xyz");
  await page.getByRole("button", { name: "Update" }).click();

  await expect(page.locator("#form-message")).toHaveText("Currency updated");
  await expect(page.locator("#currencies-body")).toContainText(updatedName);
  await expect(page.locator("#currencies-body")).toContainText("XYZ");

  await page.locator('button[data-action="delete"]').first().click();
  await expect(page.locator("#form-message")).toHaveText("Currency deleted");
  await expect(page.locator("#currencies-body")).toContainText("No currencies yet");
});

test("duplicate currency shows backend conflict message", async ({ page }) => {
  const suffix = uniqueSuffix();
  const name = `Duplicate ${suffix}`;

  await page.goto("/");

  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Code").fill("dup");
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.locator("#form-message")).toHaveText("Currency created");

  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Code").fill("dup");
  await page.getByRole("button", { name: "Create" }).click();

  await expect(page.locator("#form-message")).toHaveText("name and code must be unique");
  await expect(page.locator("#form-message")).toHaveClass(/error/);
});