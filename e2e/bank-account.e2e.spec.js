const { test, expect } = require("@playwright/test");

function uniqueSuffix() {
  return `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

test("bank account CRUD flow works end-to-end", async ({ page }) => {
  const suffix = uniqueSuffix();
  const currencyName = `Account Currency ${suffix}`;
  const currencyCode = `A${String(Date.now()).slice(-5)}`;
  const bankName = `Account Bank ${suffix}`;
  const initialAccountNumber = `ACC-${suffix}`;
  const updatedAccountNumber = `ACC-U-${suffix}`;

  await page.goto("/");

  await page.getByRole("button", { name: "Currency" }).click();
  const currencyForm = page.locator("#currency-form");
  await currencyForm.getByLabel("Name").fill(currencyName);
  await currencyForm.getByLabel("Code").fill(currencyCode);
  await currencyForm.getByRole("button", { name: "Create" }).click();
  await expect(page.locator("#form-message")).toHaveText("Currency created");

  await page.getByRole("button", { name: "Banks" }).click();
  const bankForm = page.locator("#bank-form");
  await bankForm.getByLabel("Name").fill(bankName);
  await bankForm.getByLabel("Country").selectOption("US");
  await bankForm.getByRole("button", { name: "Create" }).click();
  await expect(page.locator("#bank-form-message")).toHaveText("Bank created");

  await page.getByRole("button", { name: "Bank Accounts" }).click();
  const bankAccountForm = page.locator("#bank-account-form");

  await bankAccountForm.getByLabel("Bank").selectOption({ label: `${bankName} (US)` });
  await bankAccountForm.getByLabel("Currency").selectOption({ label: `${currencyCode} - ${currencyName}` });
  await bankAccountForm.getByLabel("Account Number").fill(initialAccountNumber);
  await bankAccountForm.getByLabel("Balance").fill("12.34");
  await bankAccountForm.getByRole("button", { name: "Create" }).click();

  await expect(page.locator("#bank-account-form-message")).toHaveText("Bank account created");
  await expect(page.locator("#bank-accounts-body")).toContainText(initialAccountNumber);

  const initialRow = page.locator("#bank-accounts-body tr", { hasText: initialAccountNumber });
  await initialRow.locator('button[data-action="edit"]').click();
  await expect(page.locator("#bank-account-submit-button")).toHaveText("Update");

  await bankAccountForm.getByLabel("Account Number").fill(updatedAccountNumber);
  await bankAccountForm.getByLabel("Balance").fill("20");
  await bankAccountForm.getByRole("button", { name: "Update" }).click();

  await expect(page.locator("#bank-account-form-message")).toHaveText("Bank account updated");
  await expect(page.locator("#bank-accounts-body")).toContainText(updatedAccountNumber);

  const updatedRow = page.locator("#bank-accounts-body tr", { hasText: updatedAccountNumber });
  await updatedRow.locator('button[data-action="delete"]').click();
  await expect(page.locator("#bank-account-form-message")).toHaveText("Bank account deleted");
  await expect(page.locator("#bank-accounts-body")).not.toContainText(updatedAccountNumber);
});

test("duplicate bank account shows backend conflict message", async ({ page }) => {
  const suffix = uniqueSuffix();
  const currencyName = `Dup Account Currency ${suffix}`;
  const currencyCode = `D${String(Date.now()).slice(-5)}`;
  const bankName = `Dup Account Bank ${suffix}`;
  const accountNumber = `DUP-${suffix}`;

  await page.goto("/");

  await page.getByRole("button", { name: "Currency" }).click();
  const currencyForm = page.locator("#currency-form");
  await currencyForm.getByLabel("Name").fill(currencyName);
  await currencyForm.getByLabel("Code").fill(currencyCode);
  await currencyForm.getByRole("button", { name: "Create" }).click();
  await expect(page.locator("#form-message")).toHaveText("Currency created");

  await page.getByRole("button", { name: "Banks" }).click();
  const bankForm = page.locator("#bank-form");
  await bankForm.getByLabel("Name").fill(bankName);
  await bankForm.getByLabel("Country").selectOption("US");
  await bankForm.getByRole("button", { name: "Create" }).click();
  await expect(page.locator("#bank-form-message")).toHaveText("Bank created");

  await page.getByRole("button", { name: "Bank Accounts" }).click();
  const bankAccountForm = page.locator("#bank-account-form");

  await bankAccountForm.getByLabel("Bank").selectOption({ label: `${bankName} (US)` });
  await bankAccountForm.getByLabel("Currency").selectOption({ label: `${currencyCode} - ${currencyName}` });
  await bankAccountForm.getByLabel("Account Number").fill(accountNumber);
  await bankAccountForm.getByLabel("Balance").fill("50");
  await bankAccountForm.getByRole("button", { name: "Create" }).click();
  await expect(page.locator("#bank-account-form-message")).toHaveText("Bank account created");

  await bankAccountForm.getByLabel("Bank").selectOption({ label: `${bankName} (US)` });
  await bankAccountForm.getByLabel("Currency").selectOption({ label: `${currencyCode} - ${currencyName}` });
  await bankAccountForm.getByLabel("Account Number").fill(accountNumber);
  await bankAccountForm.getByLabel("Balance").fill("99");
  await bankAccountForm.getByRole("button", { name: "Create" }).click();

  await expect(page.locator("#bank-account-form-message")).toHaveText(
    "bank, currency and account number combination must be unique"
  );
  await expect(page.locator("#bank-account-form-message")).toHaveClass(/error/);
});
