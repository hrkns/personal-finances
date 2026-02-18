const { test, expect } = require("@playwright/test");

function uniqueSuffix() {
  return `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

async function openSettingsSection(page, sectionName) {
  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByRole("button", { name: sectionName }).click();
}

test("transaction category CRUD flow works end-to-end", async ({ page }) => {
  const suffix = uniqueSuffix();
  const rootName = `Salary ${suffix}`;
  const childName = `Job 1 ${suffix}`;
  const updatedChildName = `Job One ${suffix}`;
  const form = page.locator("#transaction-category-form");

  await page.goto("/");
  await openSettingsSection(page, "Transaction Categories");

  await form.getByLabel("Name").fill(rootName);
  await form.getByRole("button", { name: "Create" }).click();
  await expect(page.locator("#transaction-category-form-message")).toHaveText("Transaction category created");
  await expect(page.locator("#transaction-categories-body")).toContainText(rootName);

  await form.getByLabel("Name").fill(childName);
  const parentSelectForFirstChild = form.getByLabel("Parent Category");
  await expect(parentSelectForFirstChild).toContainText(rootName);
  const parentValueForFirstChild = await form.getByLabel("Parent Category").evaluate((select, targetName) => {
    const option = [...select.options].find((item) => item.textContent.includes(targetName));
    return option ? option.value : "";
  }, rootName);
  await form.getByLabel("Parent Category").selectOption(parentValueForFirstChild);
  await form.getByRole("button", { name: "Create" }).click();

  await expect(page.locator("#transaction-category-form-message")).toHaveText("Transaction category created");
  await expect(page.locator("#transaction-categories-body")).toContainText(childName);
  await expect(page.locator("#transaction-categories-body")).toContainText(rootName);

  const childRow = page.locator("#transaction-categories-body tr", { hasText: childName });
  await childRow.locator('button[data-action="edit"]').click();
  await expect(page.locator("#transaction-category-submit-button")).toHaveText("Update");

  await form.getByLabel("Name").fill(updatedChildName);
  await form.getByRole("button", { name: "Update" }).click();

  await expect(page.locator("#transaction-category-form-message")).toHaveText("Transaction category updated");
  await expect(page.locator("#transaction-categories-body")).toContainText(updatedChildName);

  const updatedChildRow = page.locator("#transaction-categories-body tr", { hasText: updatedChildName });
  await updatedChildRow.locator('button[data-action="delete"]').click();
  await expect(page.locator("#transaction-category-form-message")).toHaveText("Transaction category deleted");

  const rootRow = page.locator(
    `#transaction-categories-body button[data-action="delete"][data-id="${parentValueForFirstChild}"]`
  );
  await rootRow.click();
  await expect(page.locator("#transaction-category-form-message")).toHaveText("Transaction category deleted");
  await expect(page.locator("#transaction-categories-body")).not.toContainText(rootName);
});

test("transaction category with child cannot be deleted", async ({ page }) => {
  const suffix = uniqueSuffix();
  const rootName = `Salary ${suffix}`;
  const childName = `Job 1 ${suffix}`;
  const form = page.locator("#transaction-category-form");

  await page.goto("/");
  await openSettingsSection(page, "Transaction Categories");

  await form.getByLabel("Name").fill(rootName);
  await form.getByRole("button", { name: "Create" }).click();
  await expect(page.locator("#transaction-category-form-message")).toHaveText("Transaction category created");

  await form.getByLabel("Name").fill(childName);
  const parentSelectForSecondChild = form.getByLabel("Parent Category");
  await expect(parentSelectForSecondChild).toContainText(rootName);
  const parentValueForSecondTest = await form.getByLabel("Parent Category").evaluate((select, targetName) => {
    const option = [...select.options].find((item) => item.textContent.includes(targetName));
    return option ? option.value : "";
  }, rootName);
  await form.getByLabel("Parent Category").selectOption(parentValueForSecondTest);
  await form.getByRole("button", { name: "Create" }).click();
  await expect(page.locator("#transaction-category-form-message")).toHaveText("Transaction category created");
  await expect(page.locator("#transaction-categories-body")).toContainText(rootName);
  await expect(page.locator("#transaction-categories-body")).toContainText(childName);

  const rootDeleteButton = page.locator(
    `#transaction-categories-body button[data-action="delete"][data-id="${parentValueForSecondTest}"]`
  );
  await expect(rootDeleteButton).toBeVisible();
  await rootDeleteButton.click();

  await expect(page.locator("#transaction-category-form-message")).toHaveText("transaction category is in use");
  await expect(page.locator("#transaction-category-form-message")).toHaveClass(/error/);
});
