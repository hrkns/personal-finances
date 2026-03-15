const { test, expect } = require("@playwright/test");
const { openApp, openSettingsSection, uniqueCurrencyCode } = require("./helpers");

function uniqueSuffix() {
  return `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

function formatDateAsISO(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDateFixtures() {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const secondInMonthDate = new Date(now.getFullYear(), now.getMonth(), Math.min(2, endDate.getDate()));
  const thirdInMonthDate = new Date(now.getFullYear(), now.getMonth(), Math.min(3, endDate.getDate()));
  const previousMonthLastDate = new Date(now.getFullYear(), now.getMonth(), 0);

  return {
    start: formatDateAsISO(startDate),
    end: formatDateAsISO(endDate),
    secondInMonth: formatDateAsISO(secondInMonthDate),
    thirdInMonth: formatDateAsISO(thirdInMonthDate),
    previousMonthLast: formatDateAsISO(previousMonthLastDate),
  };
}

async function selectOptionContaining(selectLocator, expectedText) {
  const value = await selectLocator.evaluate((element, text) => {
    const option = [...element.options].find((item) => (item.textContent || "").includes(text));
    return option ? option.value : null;
  }, expectedText);

  expect(value).toBeTruthy();
  await selectLocator.selectOption(value);
}

async function getOptionValueContaining(selectLocator, expectedText) {
  const value = await selectLocator.evaluate((element, text) => {
    const option = [...element.options].find((item) => (item.textContent || "").includes(text));
    return option ? option.value : null;
  }, expectedText);

  expect(value).toBeTruthy();
  return value;
}

async function createPersonWithRetry(page, baseName, maxAttempts = 3) {
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const personName = attempt === 1 ? baseName : `${baseName} Retry ${attempt}`;

    await openSettingsSection(page, "People");
    await page.getByRole("button", { name: "Create person" }).click();

    const peopleForm = page.locator("#person-form");
    await peopleForm.getByLabel("Name").fill(personName);
    await peopleForm.getByRole("button", { name: "Create" }).click();

    try {
      await expect(page.locator("#person-form-message")).toHaveText("Person created", { timeout: 7000 });
      return personName;
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        await page.waitForTimeout(400);
      }
    }
  }

  throw lastError || new Error("Could not create person");
}

async function createTransactionDependencies(page, suffix, options = {}) {
  const {
    createSecondBankAccount = false,
  } = options;

  const basePersonName = `Transaction Person ${suffix}`;
  const categoryName = `Transaction Category ${suffix}`;
  const currencyName = `Transaction Currency ${suffix}`;
  const currencyCode = uniqueCurrencyCode("T");
  const bankName = `Transaction Bank ${suffix}`;
  const accountNumber = `TX-${suffix}`;
  const secondAccountNumber = `TX2-${suffix}`;

  const personName = await createPersonWithRetry(page, basePersonName);

  await page.getByRole("button", { name: "Transactions" }).click();
  await page.getByRole("button", { name: "Transaction Categories" }).click();
  await page.getByRole("button", { name: "Create transaction category" }).click();
  const categoryForm = page.locator("#transaction-category-form");
  await categoryForm.getByLabel("Name").fill(categoryName);
  await categoryForm.getByRole("button", { name: "Create" }).click();
  await expect(page.locator("#transaction-category-form-message")).toHaveText("Transaction category created");

  await openSettingsSection(page, "Currencies");
  await page.getByRole("button", { name: "Create currency" }).click();
  const currencyForm = page.locator("#currency-form");
  await currencyForm.getByLabel("Name").fill(currencyName);
  await currencyForm.getByLabel("Code").fill(currencyCode);
  await currencyForm.getByRole("button", { name: "Create" }).click();
  await expect(page.locator("#currency-form-message")).toHaveText("Currency created");

  await openSettingsSection(page, "Banks");
  await page.getByRole("button", { name: "Create bank" }).click();
  const bankForm = page.locator("#bank-form");
  await bankForm.getByLabel("Name").fill(bankName);
  await bankForm.getByLabel("Country").selectOption("US");
  await bankForm.getByRole("button", { name: "Create" }).click();
  await expect(page.locator("#bank-form-message")).toHaveText("Bank created");

  await openSettingsSection(page, "Bank Accounts");
  await page.getByRole("button", { name: "Create bank account" }).click();
  const bankAccountForm = page.locator("#bank-account-form");
  await bankAccountForm.getByLabel("Bank").selectOption({ label: `${bankName} (US)` });
  await bankAccountForm.getByLabel("Currency").selectOption({ label: `${currencyCode} - ${currencyName}` });
  await bankAccountForm.getByLabel("Account Number").fill(accountNumber);
  await bankAccountForm.getByLabel("Balance").fill("100");
  await bankAccountForm.getByRole("button", { name: "Create" }).click();
  await expect(page.locator("#bank-account-form-message")).toHaveText("Bank account created");

  if (createSecondBankAccount) {
    await page.getByRole("button", { name: "Create bank account" }).click();
    await bankAccountForm.getByLabel("Bank").selectOption({ label: `${bankName} (US)` });
    await bankAccountForm.getByLabel("Currency").selectOption({ label: `${currencyCode} - ${currencyName}` });
    await bankAccountForm.getByLabel("Account Number").fill(secondAccountNumber);
    await bankAccountForm.getByLabel("Balance").fill("150");
    await bankAccountForm.getByRole("button", { name: "Create" }).click();
    await expect(page.locator("#bank-account-form-message")).toHaveText("Bank account created");
  }

  return {
    personName,
    categoryName,
    accountNumber,
    secondAccountNumber,
  };
}

async function createTransaction(page, values) {
  const {
    date,
    type,
    amount,
    notes = "",
    personName,
    accountNumber,
    categoryName,
  } = values;

  await page.getByRole("button", { name: "Create transaction" }).click();
  const transactionForm = page.locator("#transaction-form");
  await transactionForm.getByLabel("Date").fill(date);
  await transactionForm.getByLabel("Type").selectOption(type);
  await transactionForm.getByLabel("Amount").fill(String(amount));
  await selectOptionContaining(transactionForm.getByLabel("Person"), personName);
  await selectOptionContaining(transactionForm.getByLabel("Bank Account"), accountNumber);
  await selectOptionContaining(transactionForm.getByLabel("Category"), categoryName);
  await transactionForm.getByLabel("Notes").fill(notes);
  await transactionForm.getByRole("button", { name: "Create" }).click();
  await expect(page.locator("#transaction-form-message")).toHaveText("Transaction created");
}

async function readQueryParam(page, key) {
  return new URL(page.url()).searchParams.get(key);
}

async function setDateFilterInput(page, selector, value) {
  await page.locator(selector).evaluate((element, nextValue) => {
    const EventConstructor = element.ownerDocument.defaultView.Event;
    element.value = nextValue;
    element.dispatchEvent(new EventConstructor("change", { bubbles: true }));
  }, value);
}

test("transaction CRUD flow works end-to-end", async ({ page }) => {
  const dates = getDateFixtures();
  const suffix = uniqueSuffix();
  const personName = `Transaction Person ${suffix}`;
  const categoryName = `Transaction Category ${suffix}`;
  const currencyName = `Transaction Currency ${suffix}`;
  const currencyCode = uniqueCurrencyCode("T");
  const bankName = `Transaction Bank ${suffix}`;
  const accountNumber = `TX-${suffix}`;

  await openApp(page);

  await openSettingsSection(page, "People");
  await page.getByRole("button", { name: "Create person" }).click();
  const peopleForm = page.locator("#person-form");
  await peopleForm.getByLabel("Name").fill(personName);
  await peopleForm.getByRole("button", { name: "Create" }).click();
  await expect(page.locator("#person-form-message")).toHaveText("Person created");

  await page.getByRole("button", { name: "Transactions" }).click();
  await page.getByRole("button", { name: "Transaction Categories" }).click();
  await page.getByRole("button", { name: "Create transaction category" }).click();
  const categoryForm = page.locator("#transaction-category-form");
  await categoryForm.getByLabel("Name").fill(categoryName);
  await categoryForm.getByRole("button", { name: "Create" }).click();
  await expect(page.locator("#transaction-category-form-message")).toHaveText("Transaction category created");

  await openSettingsSection(page, "Currencies");
  await page.getByRole("button", { name: "Create currency" }).click();
  const currencyForm = page.locator("#currency-form");
  await currencyForm.getByLabel("Name").fill(currencyName);
  await currencyForm.getByLabel("Code").fill(currencyCode);
  await currencyForm.getByRole("button", { name: "Create" }).click();
  await expect(page.locator("#currency-form-message")).toHaveText("Currency created");

  await openSettingsSection(page, "Banks");
  await page.getByRole("button", { name: "Create bank" }).click();
  const bankForm = page.locator("#bank-form");
  await bankForm.getByLabel("Name").fill(bankName);
  await bankForm.getByLabel("Country").selectOption("US");
  await bankForm.getByRole("button", { name: "Create" }).click();
  await expect(page.locator("#bank-form-message")).toHaveText("Bank created");

  await openSettingsSection(page, "Bank Accounts");
  await page.getByRole("button", { name: "Create bank account" }).click();
  const bankAccountForm = page.locator("#bank-account-form");
  await bankAccountForm.getByLabel("Bank").selectOption({ label: `${bankName} (US)` });
  await bankAccountForm.getByLabel("Currency").selectOption({ label: `${currencyCode} - ${currencyName}` });
  await bankAccountForm.getByLabel("Account Number").fill(accountNumber);
  await bankAccountForm.getByLabel("Balance").fill("100");
  await bankAccountForm.getByRole("button", { name: "Create" }).click();
  await expect(page.locator("#bank-account-form-message")).toHaveText("Bank account created");

  await page.getByRole("button", { name: "Transactions" }).click();

  await page.getByRole("button", { name: "Create transaction" }).click();

  const transactionForm = page.locator("#transaction-form");
  await transactionForm.getByLabel("Date").fill(dates.secondInMonth);
  await transactionForm.getByLabel("Type").selectOption("income");
  await transactionForm.getByLabel("Amount").fill("1200.50");
  await selectOptionContaining(transactionForm.getByLabel("Person"), personName);
  await selectOptionContaining(transactionForm.getByLabel("Bank Account"), accountNumber);
  await selectOptionContaining(transactionForm.getByLabel("Category"), categoryName);
  await transactionForm.getByLabel("Notes").fill("Salary payment");
  await transactionForm.getByRole("button", { name: "Create" }).click();

  await expect(page.locator("#transaction-form-message")).toHaveText("Transaction created");
  await expect(page.locator("#transactions-body")).toContainText(dates.secondInMonth);
  await expect(page.locator("#transactions-body")).toContainText("income");
  await expect(page.locator("#transactions-body")).toContainText("Salary payment");

  const createdRow = page.locator("#transactions-body tr", { hasText: dates.secondInMonth });
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

test("transaction list shows running balance after each transaction", async ({ page }) => {
  const dates = getDateFixtures();
  const suffix = uniqueSuffix();
  const personName = `Transaction Balance Person ${suffix}`;
  const categoryName = `Transaction Balance Category ${suffix}`;
  const currencyName = `Transaction Balance Currency ${suffix}`;
  const currencyCode = uniqueCurrencyCode("B");
  const bankName = `Transaction Balance Bank ${suffix}`;
  const accountNumber = `TXB-${suffix}`;

  await openApp(page);

  await openSettingsSection(page, "People");
  await page.getByRole("button", { name: "Create person" }).click();
  const peopleForm = page.locator("#person-form");
  await peopleForm.getByLabel("Name").fill(personName);
  await peopleForm.getByRole("button", { name: "Create" }).click();
  await expect(page.locator("#person-form-message")).toHaveText("Person created");

  await page.getByRole("button", { name: "Transactions" }).click();
  await page.getByRole("button", { name: "Transaction Categories" }).click();
  await page.getByRole("button", { name: "Create transaction category" }).click();
  const categoryForm = page.locator("#transaction-category-form");
  await categoryForm.getByLabel("Name").fill(categoryName);
  await categoryForm.getByRole("button", { name: "Create" }).click();
  await expect(page.locator("#transaction-category-form-message")).toHaveText("Transaction category created");

  await openSettingsSection(page, "Currencies");
  await page.getByRole("button", { name: "Create currency" }).click();
  const currencyForm = page.locator("#currency-form");
  await currencyForm.getByLabel("Name").fill(currencyName);
  await currencyForm.getByLabel("Code").fill(currencyCode);
  await currencyForm.getByRole("button", { name: "Create" }).click();
  await expect(page.locator("#currency-form-message")).toHaveText("Currency created");

  await openSettingsSection(page, "Banks");
  await page.getByRole("button", { name: "Create bank" }).click();
  const bankForm = page.locator("#bank-form");
  await bankForm.getByLabel("Name").fill(bankName);
  await bankForm.getByLabel("Country").selectOption("US");
  await bankForm.getByRole("button", { name: "Create" }).click();
  await expect(page.locator("#bank-form-message")).toHaveText("Bank created");

  await openSettingsSection(page, "Bank Accounts");
  await page.getByRole("button", { name: "Create bank account" }).click();
  const bankAccountForm = page.locator("#bank-account-form");
  await bankAccountForm.getByLabel("Bank").selectOption({ label: `${bankName} (US)` });
  await bankAccountForm.getByLabel("Currency").selectOption({ label: `${currencyCode} - ${currencyName}` });
  await bankAccountForm.getByLabel("Account Number").fill(accountNumber);
  await bankAccountForm.getByLabel("Balance").fill("100");
  await bankAccountForm.getByRole("button", { name: "Create" }).click();
  await expect(page.locator("#bank-account-form-message")).toHaveText("Bank account created");

  await page.getByRole("button", { name: "Transactions" }).click();
  await expect(page.locator("#view-transactions thead tr th").nth(6)).toHaveText("Balance");

  await page.getByRole("button", { name: "Create transaction" }).click();

  const transactionForm = page.locator("#transaction-form");

  await transactionForm.getByLabel("Date").fill(dates.secondInMonth);
  await transactionForm.getByLabel("Type").selectOption("income");
  await transactionForm.getByLabel("Amount").fill("300");
  await selectOptionContaining(transactionForm.getByLabel("Person"), personName);
  await selectOptionContaining(transactionForm.getByLabel("Bank Account"), accountNumber);
  await selectOptionContaining(transactionForm.getByLabel("Category"), categoryName);
  await transactionForm.getByRole("button", { name: "Create" }).click();
  await expect(page.locator("#transaction-form-message")).toHaveText("Transaction created");

  await page.getByRole("button", { name: "Create transaction" }).click();

  await transactionForm.getByLabel("Date").fill(dates.thirdInMonth);
  await transactionForm.getByLabel("Type").selectOption("expense");
  await transactionForm.getByLabel("Amount").fill("120");
  await selectOptionContaining(transactionForm.getByLabel("Person"), personName);
  await selectOptionContaining(transactionForm.getByLabel("Bank Account"), accountNumber);
  await selectOptionContaining(transactionForm.getByLabel("Category"), categoryName);
  await transactionForm.getByRole("button", { name: "Create" }).click();
  await expect(page.locator("#transaction-form-message")).toHaveText("Transaction created");

  const firstRow = page.locator("#transactions-body tr", { hasText: dates.secondInMonth });
  const secondRow = page.locator("#transactions-body tr", { hasText: dates.thirdInMonth });

  await expect(firstRow.locator("td").nth(6)).toHaveText("400.00");
  await expect(secondRow.locator("td").nth(6)).toHaveText("280.00");
});

test("transactions view initializes default month date filter and records params in URL", async ({ page }) => {
  const dates = getDateFixtures();

  await openApp(page);
  await page.getByRole("button", { name: "Transactions" }).click();

  await expect(page.locator("#transactions-filter-start-date")).toHaveValue(dates.start);
  await expect(page.locator("#transactions-filter-end-date")).toHaveValue(dates.end);
  await expect.poll(() => readQueryParam(page, "transactionsStartDate")).toBe(dates.start);
  await expect.poll(() => readQueryParam(page, "transactionsEndDate")).toBe(dates.end);
});

test("transactions sorting by amount updates URL and persists across reload", async ({ page }) => {
  const suffix = uniqueSuffix();
  const dates = getDateFixtures();

  await openApp(page);
  const setup = await createTransactionDependencies(page, suffix);

  await page.getByRole("button", { name: "Transactions" }).click();

  await createTransaction(page, {
    date: dates.secondInMonth,
    type: "income",
    amount: "300",
    notes: "Amount high",
    personName: setup.personName,
    accountNumber: setup.accountNumber,
    categoryName: setup.categoryName,
  });

  await createTransaction(page, {
    date: dates.thirdInMonth,
    type: "income",
    amount: "120",
    notes: "Amount low",
    personName: setup.personName,
    accountNumber: setup.accountNumber,
    categoryName: setup.categoryName,
  });

  const amountHeader = page.locator("#transactions-table thead th", { hasText: "Amount" }).first();
  await amountHeader.click();

  await expect.poll(() => readQueryParam(page, "transactionsSort")).toBe("amount");
  const firstSortOrder = await readQueryParam(page, "transactionsOrder");
  const firstRowAmount = await page.locator("#transactions-body tr:first-child td:nth-child(4)").textContent();

  await amountHeader.click();
  await expect.poll(async () => {
    const nextOrder = await readQueryParam(page, "transactionsOrder");
    return nextOrder && nextOrder !== firstSortOrder;
  }).toBeTruthy();

  const secondSortOrder = await readQueryParam(page, "transactionsOrder");
  const secondRowAmount = await page.locator("#transactions-body tr:first-child td:nth-child(4)").textContent();
  expect(secondRowAmount).not.toBe(firstRowAmount);

  await page.reload({ waitUntil: "domcontentloaded" });
  await expect.poll(() => readQueryParam(page, "transactionsSort")).toBe("amount");
  await expect.poll(() => readQueryParam(page, "transactionsOrder")).toBe(secondSortOrder);

  await expect(page.locator("#transactions-body tr:first-child td:nth-child(4)")).toHaveText((secondRowAmount || "").trim());
});

test("transactions date range filter updates URL and clear button restores all rows", async ({ page }) => {
  const suffix = uniqueSuffix();
  const dates = getDateFixtures();

  await openApp(page);
  const setup = await createTransactionDependencies(page, suffix);

  await page.getByRole("button", { name: "Transactions" }).click();

  await createTransaction(page, {
    date: dates.secondInMonth,
    type: "income",
    amount: "200",
    notes: "Current month row",
    personName: setup.personName,
    accountNumber: setup.accountNumber,
    categoryName: setup.categoryName,
  });

  await createTransaction(page, {
    date: dates.previousMonthLast,
    type: "income",
    amount: "50",
    notes: "Previous month row",
    personName: setup.personName,
    accountNumber: setup.accountNumber,
    categoryName: setup.categoryName,
  });

  await expect(page.locator("#transactions-body")).toContainText("Current month row");
  await expect(page.locator("#transactions-body")).not.toContainText("Previous month row");

  await page.locator("#transactions-filter-start-date").fill(dates.previousMonthLast);
  await page.locator("#transactions-filter-end-date").fill(dates.previousMonthLast);
  await page.locator("#transactions-filter-end-date").dispatchEvent("change");

  await expect.poll(() => readQueryParam(page, "transactionsStartDate")).toBe(dates.previousMonthLast);
  await expect.poll(() => readQueryParam(page, "transactionsEndDate")).toBe(dates.previousMonthLast);
  await expect(page.locator("#transactions-body")).toContainText("Previous month row");
  await expect(page.locator("#transactions-body")).not.toContainText("Current month row");

  await page.locator("#transactions-filter-clear-button").click();

  await expect(page.locator("#transactions-filter-start-date")).toHaveValue("");
  await expect(page.locator("#transactions-filter-end-date")).toHaveValue("");
  await expect.poll(() => readQueryParam(page, "transactionsStartDate")).toBeNull();
  await expect.poll(() => readQueryParam(page, "transactionsEndDate")).toBeNull();
  await expect(page.locator("#transactions-body")).toContainText("Current month row");
  await expect(page.locator("#transactions-body")).toContainText("Previous month row");
});

test("transactions open-ended date filter updates URL and filters with one bound", async ({ page }) => {
  const suffix = uniqueSuffix();
  const dates = getDateFixtures();

  await openApp(page);
  const setup = await createTransactionDependencies(page, suffix);

  await page.getByRole("button", { name: "Transactions" }).click();

  await createTransaction(page, {
    date: dates.secondInMonth,
    type: "income",
    amount: "80",
    notes: "Second day row",
    personName: setup.personName,
    accountNumber: setup.accountNumber,
    categoryName: setup.categoryName,
  });

  await createTransaction(page, {
    date: dates.thirdInMonth,
    type: "income",
    amount: "100",
    notes: "Third day row",
    personName: setup.personName,
    accountNumber: setup.accountNumber,
    categoryName: setup.categoryName,
  });

  await page.locator("#transactions-filter-end-date").fill("");
  await page.locator("#transactions-filter-end-date").dispatchEvent("change");
  await expect.poll(() => readQueryParam(page, "transactionsEndDate")).toBeNull();

  await page.locator("#transactions-filter-start-date").fill(dates.thirdInMonth);
  await page.locator("#transactions-filter-start-date").dispatchEvent("change");

  await expect.poll(() => readQueryParam(page, "transactionsStartDate")).toBe(dates.thirdInMonth);
  await expect.poll(() => readQueryParam(page, "transactionsEndDate")).toBeNull();
  await expect(page.locator("#transactions-body")).toContainText("Third day row");
  await expect(page.locator("#transactions-body")).not.toContainText("Second day row");
});

test("transactions invalid date range preserves inputs, shows error, and keeps URL params", async ({ page }) => {
  const suffix = uniqueSuffix();
  const dates = getDateFixtures();

  await openApp(page);
  const setup = await createTransactionDependencies(page, suffix);

  await page.getByRole("button", { name: "Transactions" }).click();

  await createTransaction(page, {
    date: dates.secondInMonth,
    type: "income",
    amount: "80",
    notes: "Second day row",
    personName: setup.personName,
    accountNumber: setup.accountNumber,
    categoryName: setup.categoryName,
  });

  await createTransaction(page, {
    date: dates.thirdInMonth,
    type: "income",
    amount: "100",
    notes: "Third day row",
    personName: setup.personName,
    accountNumber: setup.accountNumber,
    categoryName: setup.categoryName,
  });

  await setDateFilterInput(page, "#transactions-filter-end-date", "");
  await setDateFilterInput(page, "#transactions-filter-start-date", dates.thirdInMonth);

  await expect.poll(() => readQueryParam(page, "transactionsStartDate")).toBe(dates.thirdInMonth);
  await expect.poll(() => readQueryParam(page, "transactionsEndDate")).toBeNull();

  await setDateFilterInput(page, "#transactions-filter-end-date", dates.secondInMonth);

  await expect(page.locator("#transactions-filter-start-date")).toHaveValue(dates.thirdInMonth);
  await expect(page.locator("#transactions-filter-end-date")).toHaveValue(dates.secondInMonth);
  await expect(page.locator("#transactions-filter-message")).toHaveText("Start date must be on or before end date.");
  await expect.poll(() => readQueryParam(page, "transactionsStartDate")).toBe(dates.thirdInMonth);
  await expect.poll(() => readQueryParam(page, "transactionsEndDate")).toBeNull();
  await expect(page.locator("#transactions-body")).toContainText("No transactions yet");
  await expect(page.locator("#transactions-body")).not.toContainText("Third day row");
  await expect(page.locator("#transactions-body")).not.toContainText("Second day row");
});

test("transactions bank account multi-select filter updates URL and supports all-accounts fallback", async ({ page }) => {
  const suffix = uniqueSuffix();
  const dates = getDateFixtures();

  await openApp(page);
  const setup = await createTransactionDependencies(page, suffix, { createSecondBankAccount: true });

  await page.getByRole("button", { name: "Transactions" }).click();

  await createTransaction(page, {
    date: dates.secondInMonth,
    type: "income",
    amount: "70",
    notes: "First account row",
    personName: setup.personName,
    accountNumber: setup.accountNumber,
    categoryName: setup.categoryName,
  });

  await createTransaction(page, {
    date: dates.thirdInMonth,
    type: "income",
    amount: "90",
    notes: "Second account row",
    personName: setup.personName,
    accountNumber: setup.secondAccountNumber,
    categoryName: setup.categoryName,
  });

  const bankFilter = page.locator("#transactions-filter-bank-accounts");
  const firstAccountID = await getOptionValueContaining(bankFilter, setup.accountNumber);
  const secondAccountID = await getOptionValueContaining(bankFilter, setup.secondAccountNumber);

  await bankFilter.selectOption([firstAccountID]);
  await expect.poll(() => readQueryParam(page, "transactionsBankAccounts")).toBe(firstAccountID);
  await expect(page.locator("#transactions-body")).toContainText("First account row");
  await expect(page.locator("#transactions-body")).not.toContainText("Second account row");

  await bankFilter.selectOption([firstAccountID, secondAccountID]);
  await expect.poll(async () => {
    const value = await readQueryParam(page, "transactionsBankAccounts");
    if (!value) {
      return false;
    }

    const selectedIDs = value.split(",").sort((left, right) => Number(left) - Number(right));
    const expectedIDs = [firstAccountID, secondAccountID].sort((left, right) => Number(left) - Number(right));
    return JSON.stringify(selectedIDs) === JSON.stringify(expectedIDs);
  }).toBeTruthy();
  await expect(page.locator("#transactions-body")).toContainText("First account row");
  await expect(page.locator("#transactions-body")).toContainText("Second account row");

  await bankFilter.selectOption([]);
  await expect.poll(() => readQueryParam(page, "transactionsBankAccounts")).toBeNull();
  await expect(page.locator("#transactions-body")).toContainText("First account row");
  await expect(page.locator("#transactions-body")).toContainText("Second account row");
});

test("transactions clear bank-account button removes account filter", async ({ page }) => {
  const suffix = uniqueSuffix();
  const dates = getDateFixtures();

  await openApp(page);
  const setup = await createTransactionDependencies(page, suffix, { createSecondBankAccount: true });

  await page.getByRole("button", { name: "Transactions" }).click();

  await createTransaction(page, {
    date: dates.secondInMonth,
    type: "income",
    amount: "70",
    notes: "First account row",
    personName: setup.personName,
    accountNumber: setup.accountNumber,
    categoryName: setup.categoryName,
  });

  await createTransaction(page, {
    date: dates.thirdInMonth,
    type: "income",
    amount: "90",
    notes: "Second account row",
    personName: setup.personName,
    accountNumber: setup.secondAccountNumber,
    categoryName: setup.categoryName,
  });

  const bankFilter = page.locator("#transactions-filter-bank-accounts");
  const firstAccountID = await getOptionValueContaining(bankFilter, setup.accountNumber);
  await bankFilter.selectOption([firstAccountID]);
  await expect.poll(() => readQueryParam(page, "transactionsBankAccounts")).toBe(firstAccountID);
  await expect(page.locator("#transactions-body")).toContainText("First account row");
  await expect(page.locator("#transactions-body")).not.toContainText("Second account row");

  await page.locator("#transactions-filter-clear-bank-accounts-button").click();

  await expect.poll(() => readQueryParam(page, "transactionsBankAccounts")).toBeNull();
  await expect(page.locator("#transactions-body")).toContainText("First account row");
  await expect(page.locator("#transactions-body")).toContainText("Second account row");
});

test("transactions clear filters button resets date and bank filters to defaults", async ({ page }) => {
  const suffix = uniqueSuffix();
  const dates = getDateFixtures();

  await openApp(page);
  const setup = await createTransactionDependencies(page, suffix, { createSecondBankAccount: true });

  await page.getByRole("button", { name: "Transactions" }).click();

  await createTransaction(page, {
    date: dates.secondInMonth,
    type: "income",
    amount: "70",
    notes: "First account row",
    personName: setup.personName,
    accountNumber: setup.accountNumber,
    categoryName: setup.categoryName,
  });

  await createTransaction(page, {
    date: dates.thirdInMonth,
    type: "income",
    amount: "90",
    notes: "Second account row",
    personName: setup.personName,
    accountNumber: setup.secondAccountNumber,
    categoryName: setup.categoryName,
  });

  const bankFilter = page.locator("#transactions-filter-bank-accounts");
  const secondAccountID = await getOptionValueContaining(bankFilter, setup.secondAccountNumber);
  await bankFilter.selectOption([secondAccountID]);
  await expect.poll(() => readQueryParam(page, "transactionsBankAccounts")).toBe(secondAccountID);

  await page.locator("#transactions-filter-end-date").fill("");
  await page.locator("#transactions-filter-end-date").dispatchEvent("change");
  await page.locator("#transactions-filter-start-date").fill(dates.thirdInMonth);
  await page.locator("#transactions-filter-start-date").dispatchEvent("change");
  await expect.poll(() => readQueryParam(page, "transactionsStartDate")).toBe(dates.thirdInMonth);
  await expect.poll(() => readQueryParam(page, "transactionsEndDate")).toBeNull();

  await page.locator("#transactions-filter-end-date").fill(dates.secondInMonth);
  await page.locator("#transactions-filter-end-date").dispatchEvent("change");
  await expect(page.locator("#transactions-filter-message")).toHaveText("Start date must be on or before end date.");

  await page.locator("#transactions-filter-clear-all-button").click();

  await expect(page.locator("#transactions-filter-start-date")).toHaveValue(dates.start);
  await expect(page.locator("#transactions-filter-end-date")).toHaveValue(dates.end);
  await expect(page.locator("#transactions-filter-message")).toHaveText("");
  await expect.poll(() => readQueryParam(page, "transactionsStartDate")).toBe(dates.start);
  await expect.poll(() => readQueryParam(page, "transactionsEndDate")).toBe(dates.end);
  await expect.poll(() => readQueryParam(page, "transactionsBankAccounts")).toBeNull();
  await expect(page.locator("#transactions-body")).toContainText("First account row");
  await expect(page.locator("#transactions-body")).toContainText("Second account row");
});
