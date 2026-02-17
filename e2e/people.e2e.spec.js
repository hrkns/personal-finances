const { test, expect } = require("@playwright/test");

function uniqueSuffix() {
  return `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

test("people CRUD flow works end-to-end", async ({ page }) => {
  const suffix = uniqueSuffix();
  const initialName = `Person ${suffix}`;
  const updatedName = `Person Updated ${suffix}`;
  const personForm = page.locator("#people-form");

  await page.goto("/");
  await page.getByRole("button", { name: "People" }).click();

  await personForm.getByLabel("Name").fill(initialName);
  await personForm.getByRole("button", { name: "Create" }).click();

  await expect(page.locator("#person-form-message")).toHaveText("Person created");
  await expect(page.locator("#people-body")).toContainText(initialName);

  const initialRow = page.locator("#people-body tr", { hasText: initialName });
  await initialRow.locator('button[data-action="edit"]').click();
  await expect(page.locator("#person-submit-button")).toHaveText("Update");

  await personForm.getByLabel("Name").fill(updatedName);
  await personForm.getByRole("button", { name: "Update" }).click();

  await expect(page.locator("#person-form-message")).toHaveText("Person updated");
  await expect(page.locator("#people-body")).toContainText(updatedName);

  const updatedRow = page.locator("#people-body tr", { hasText: updatedName });
  await updatedRow.locator('button[data-action="delete"]').click();
  await expect(page.locator("#person-form-message")).toHaveText("Person deleted");
  await expect(page.locator("#people-body")).not.toContainText(updatedName);
});

test("blank person name shows validation message", async ({ page }) => {
  const personForm = page.locator("#people-form");

  await page.goto("/");
  await page.getByRole("button", { name: "People" }).click();

  await personForm.getByLabel("Name").fill("    ");
  await personForm.getByRole("button", { name: "Create" }).click();

  await expect(page.locator("#person-form-message")).toHaveText("name is required");
  await expect(page.locator("#person-form-message")).toHaveClass(/error/);
});
