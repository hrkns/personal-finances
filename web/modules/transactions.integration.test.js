const test = require("node:test");
const assert = require("node:assert/strict");

const { setupFrontendApp } = require("../integration-test-setup.js");

async function flush() {
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
}

function formatDateAsISO(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getCurrentMonthDateFixtures() {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const secondDate = new Date(now.getFullYear(), now.getMonth(), Math.min(2, endDate.getDate()));
  const thirdDate = new Date(now.getFullYear(), now.getMonth(), Math.min(3, endDate.getDate()));
  const previousMonthLastDate = new Date(now.getFullYear(), now.getMonth(), 0);

  return {
    start: formatDateAsISO(startDate),
    end: formatDateAsISO(endDate),
    firstInMonth: formatDateAsISO(startDate),
    secondInMonth: formatDateAsISO(secondDate),
    thirdInMonth: formatDateAsISO(thirdDate),
    previousMonthLast: formatDateAsISO(previousMonthLastDate),
  };
}

async function submitTransaction(window, document, values) {
  const {
    date,
    type,
    amount,
    notes = "",
    personID = "1",
    bankAccountID = "1",
    categoryID = "1",
  } = values;

  document.getElementById("transaction-date").value = date;
  document.getElementById("transaction-type").value = type;
  document.getElementById("transaction-amount").value = String(amount);
  document.getElementById("transaction-person-id").value = personID;
  document.getElementById("transaction-bank-account-id").value = bankAccountID;
  document.getElementById("transaction-category-id-input").value = categoryID;
  document.getElementById("transaction-notes").value = notes;
  document.getElementById("transaction-form").dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
  await flush();
}

async function seedTransactionDependencies(window, document) {
  document.querySelector('[data-route-tab="settings"]').click();
  document.querySelector('[data-settings-tab="people"]').click();
  document.getElementById("person-name").value = "Jane Doe";
  document.getElementById("person-form").dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
  await flush();

  document.querySelector('[data-route-tab="transactions"]').click();
  document.querySelector('[data-transactions-tab="transaction-categories"]').click();
  document.getElementById("transaction-category-name").value = "Salary";
  document
    .getElementById("transaction-category-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
  await flush();

  document.querySelector('[data-route-tab="settings"]').click();
  document.querySelector('[data-settings-tab="currencies"]').click();
  document.getElementById("currency-name").value = "US Dollar";
  document.getElementById("currency-code").value = "USD";
  document.getElementById("currency-form").dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
  await flush();

  document.querySelector('[data-route-tab="settings"]').click();
  document.querySelector('[data-settings-tab="banks"]').click();
  document.getElementById("bank-name").value = "Bank One";
  document.getElementById("bank-country").value = "US";
  document.getElementById("bank-form").dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
  await flush();

  document.querySelector('[data-route-tab="settings"]').click();
  document.querySelector('[data-settings-tab="bank-accounts"]').click();
  document.getElementById("bank-account-bank-id").value = "1";
  document.getElementById("bank-account-currency-id").value = "1";
  document.getElementById("bank-account-number").value = "ACC-001";
  document.getElementById("bank-account-balance").value = "100";
  document
    .getElementById("bank-account-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
  await flush();
}

async function createAdditionalBankAccount(window, document, values = {}) {
  const {
    bankID = "1",
    currencyID = "1",
    accountNumber = "ACC-002",
    balance = "50",
  } = values;

  document.querySelector('[data-route-tab="settings"]').click();
  document.querySelector('[data-settings-tab="bank-accounts"]').click();
  document.getElementById("bank-account-bank-id").value = bankID;
  document.getElementById("bank-account-currency-id").value = currencyID;
  document.getElementById("bank-account-number").value = accountNumber;
  document.getElementById("bank-account-balance").value = balance;
  document.getElementById("bank-account-form").dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
  await flush();
}

async function setBankAccountFilterSelection(window, document, selectedIDs) {
  const filterElement = document.getElementById("transactions-filter-bank-accounts");
  const selectedSet = new Set(selectedIDs.map(String));

  for (const option of filterElement.options) {
    option.selected = selectedSet.has(option.value);
  }

  filterElement.dispatchEvent(new window.Event("change", { bubbles: true }));
  await flush();
}

test("frontend can create and list a transaction", async () => {
  const dates = getCurrentMonthDateFixtures();
  const { dom, window, document } = await setupFrontendApp();

  await seedTransactionDependencies(window, document);

  document.querySelector('[data-route-tab="transactions"]').click();
  await submitTransaction(window, document, {
    date: dates.secondInMonth,
    type: "income",
    amount: "1200.50",
    notes: "Salary payment",
  });

  const message = document.getElementById("transaction-form-message").textContent;
  const rowsText = document.getElementById("transactions-body").textContent;

  assert.equal(message, "Transaction created");
  assert.match(rowsText, new RegExp(dates.secondInMonth));
  assert.match(rowsText, /income/);
  assert.match(rowsText, /Salary payment/);
  assert.match(rowsText, /Jane Doe/);
  assert.match(rowsText, /Salary/);
  assert.match(rowsText, /1300.50/);

  dom.window.close();
});

test("frontend shows running bank-account balance per transaction row", async () => {
  const dates = getCurrentMonthDateFixtures();
  const { dom, window, document } = await setupFrontendApp();

  await seedTransactionDependencies(window, document);

  document.querySelector('[data-route-tab="transactions"]').click();

  await submitTransaction(window, document, {
    date: dates.firstInMonth,
    type: "income",
    amount: 300,
  });

  await submitTransaction(window, document, {
    date: dates.secondInMonth,
    type: "expense",
    amount: 120,
  });

  const rows = document.querySelectorAll("#transactions-body tr");
  assert.equal(rows.length, 2);

  const rowByDate = new Map(
    Array.from(rows, (row) => {
      const cells = row.querySelectorAll("td");
      return [cells[1].textContent, cells[6].textContent];
    })
  );

  assert.equal(rowByDate.get(dates.firstInMonth), "400.00");
  assert.equal(rowByDate.get(dates.secondInMonth), "280.00");

  dom.window.close();
});

test("frontend supports transaction edit and delete actions", async () => {
  const dates = getCurrentMonthDateFixtures();
  const { dom, window, document } = await setupFrontendApp();

  await seedTransactionDependencies(window, document);

  document.querySelector('[data-route-tab="transactions"]').click();
  await submitTransaction(window, document, {
    date: dates.firstInMonth,
    type: "income",
    amount: 100,
  });

  const editButton = document.querySelector('#transactions-body button[data-action="edit"][data-id="1"]');
  editButton.dispatchEvent(new window.Event("click", { bubbles: true }));

  assert.equal(document.getElementById("transaction-submit-button").textContent, "Update");

  document.getElementById("transaction-type").value = "expense";
  document.getElementById("transaction-amount").value = "50.25";
  document.getElementById("transaction-notes").value = "Groceries";
  document.getElementById("transaction-form").dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
  await flush();

  const rowsAfterUpdate = document.getElementById("transactions-body").textContent;
  assert.match(rowsAfterUpdate, /expense/);
  assert.match(rowsAfterUpdate, /50.25/);
  assert.match(rowsAfterUpdate, /Groceries/);

  const deleteButton = document.querySelector('#transactions-body button[data-action="delete"][data-id="1"]');
  deleteButton.dispatchEvent(new window.Event("click", { bubbles: true }));
  await flush();

  assert.match(document.getElementById("transactions-body").textContent, /No transactions yet/);

  dom.window.close();
});

test("frontend shows validation error for invalid transaction payload", async () => {
  const { dom, window, document } = await setupFrontendApp();

  await seedTransactionDependencies(window, document);

  document.querySelector('[data-route-tab="transactions"]').click();
  document.getElementById("transaction-date").value = "";
  document.getElementById("transaction-type").value = "income";
  document.getElementById("transaction-amount").value = "100";
  document.getElementById("transaction-person-id").value = "1";
  document.getElementById("transaction-bank-account-id").value = "1";
  document.getElementById("transaction-category-id-input").value = "1";

  document.getElementById("transaction-form").dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
  await flush();

  const message = document.getElementById("transaction-form-message");
  assert.equal(message.textContent, "transaction_date must be a valid date in YYYY-MM-DD format");

  const toastElement = document.getElementById("transaction-form-toast");
  if (window.bootstrap?.Toast) {
    assert.match(toastElement.className, /text-bg-danger/);
  } else {
    assert.equal(message.className, "error");
  }

  dom.window.close();
});

test("frontend applies valid transaction sorting from URL params", async () => {
  const dates = getCurrentMonthDateFixtures();
  const { dom, window, document } = await setupFrontendApp({
    initialUrl: "http://localhost:8080/?view=transactions&transactions=list&transactionsSort=amount&transactionsOrder=asc",
  });

  await seedTransactionDependencies(window, document);

  document.querySelector('[data-route-tab="transactions"]').click();

  await submitTransaction(window, document, {
    date: dates.secondInMonth,
    type: "income",
    amount: 300,
  });

  await submitTransaction(window, document, {
    date: dates.thirdInMonth,
    type: "income",
    amount: 120,
  });

  const rows = document.querySelectorAll("#transactions-body tr");
  assert.equal(rows.length, 2);

  const firstRowCells = rows[0].querySelectorAll("td");
  const secondRowCells = rows[1].querySelectorAll("td");

  assert.equal(firstRowCells[3].textContent, "120.00");
  assert.equal(secondRowCells[3].textContent, "300.00");

  dom.window.close();
});

test("frontend removes invalid transaction sorting params and falls back to default sorting", async () => {
  const dates = getCurrentMonthDateFixtures();
  const { dom, window, document } = await setupFrontendApp({
    initialUrl: "http://localhost:8080/?view=transactions&transactions=list&transactionsSort=invalid&transactionsOrder=sideways",
  });

  await seedTransactionDependencies(window, document);

  document.querySelector('[data-route-tab="transactions"]').click();

  await submitTransaction(window, document, {
    date: dates.firstInMonth,
    type: "income",
    amount: 300,
  });

  await submitTransaction(window, document, {
    date: dates.secondInMonth,
    type: "income",
    amount: 120,
  });

  assert.equal(window.location.search.includes("transactionsSort="), false);
  assert.equal(window.location.search.includes("transactionsOrder="), false);

  const rows = document.querySelectorAll("#transactions-body tr");
  assert.equal(rows.length, 2);

  const firstRowCells = rows[0].querySelectorAll("td");
  const secondRowCells = rows[1].querySelectorAll("td");

  assert.equal(firstRowCells[1].textContent, dates.secondInMonth);
  assert.equal(secondRowCells[1].textContent, dates.firstInMonth);

  dom.window.close();
});

test("frontend applies default current-month date range filter and records it in URL", async () => {
  const dates = getCurrentMonthDateFixtures();
  const { dom, window, document } = await setupFrontendApp();

  await seedTransactionDependencies(window, document);

  document.querySelector('[data-route-tab="transactions"]').click();

  await submitTransaction(window, document, {
    date: dates.firstInMonth,
    type: "income",
    amount: 200,
  });

  await submitTransaction(window, document, {
    date: dates.previousMonthLast,
    type: "income",
    amount: 90,
  });

  const rows = document.querySelectorAll("#transactions-body tr");
  assert.equal(rows.length, 1);

  const rowsText = document.getElementById("transactions-body").textContent;
  assert.match(rowsText, new RegExp(dates.firstInMonth));
  assert.doesNotMatch(rowsText, new RegExp(dates.previousMonthLast));

  assert.match(window.location.search, new RegExp(`transactionsStartDate=${dates.start}`));
  assert.match(window.location.search, new RegExp(`transactionsEndDate=${dates.end}`));
  assert.equal(document.getElementById("transactions-filter-start-date").value, dates.start);
  assert.equal(document.getElementById("transactions-filter-end-date").value, dates.end);

  dom.window.close();
});

test("frontend applies valid date-range filter from URL params", async () => {
  const dates = getCurrentMonthDateFixtures();
  const { dom, window, document } = await setupFrontendApp({
    initialUrl: `http://localhost:8080/?view=transactions&transactions=list&transactionsStartDate=${dates.firstInMonth}&transactionsEndDate=${dates.firstInMonth}`,
  });

  await seedTransactionDependencies(window, document);

  document.querySelector('[data-route-tab="transactions"]').click();

  await submitTransaction(window, document, {
    date: dates.firstInMonth,
    type: "income",
    amount: 140,
  });

  await submitTransaction(window, document, {
    date: dates.secondInMonth,
    type: "income",
    amount: 220,
  });

  const rows = document.querySelectorAll("#transactions-body tr");
  assert.equal(rows.length, 1);

  const rowsText = document.getElementById("transactions-body").textContent;
  assert.match(rowsText, new RegExp(dates.firstInMonth));
  assert.doesNotMatch(rowsText, new RegExp(dates.secondInMonth));

  assert.equal(document.getElementById("transactions-filter-start-date").value, dates.firstInMonth);
  assert.equal(document.getElementById("transactions-filter-end-date").value, dates.firstInMonth);

  dom.window.close();
});

test("frontend falls back to default date range when URL filter params are invalid", async () => {
  const dates = getCurrentMonthDateFixtures();
  const { dom, window, document } = await setupFrontendApp({
    initialUrl: "http://localhost:8080/?view=transactions&transactions=list&transactionsStartDate=invalid&transactionsEndDate=2026-19-50",
  });

  await seedTransactionDependencies(window, document);

  document.querySelector('[data-route-tab="transactions"]').click();

  await submitTransaction(window, document, {
    date: dates.firstInMonth,
    type: "income",
    amount: 140,
  });

  await submitTransaction(window, document, {
    date: dates.previousMonthLast,
    type: "income",
    amount: 220,
  });

  const rows = document.querySelectorAll("#transactions-body tr");
  assert.equal(rows.length, 1);

  const rowsText = document.getElementById("transactions-body").textContent;
  assert.match(rowsText, new RegExp(dates.firstInMonth));
  assert.doesNotMatch(rowsText, new RegExp(dates.previousMonthLast));

  assert.match(window.location.search, new RegExp(`transactionsStartDate=${dates.start}`));
  assert.match(window.location.search, new RegExp(`transactionsEndDate=${dates.end}`));
  assert.doesNotMatch(window.location.search, /transactionsStartDate=invalid/);

  dom.window.close();
});

test("frontend clear date-range control removes filter and shows all transactions", async () => {
  const dates = getCurrentMonthDateFixtures();
  const { dom, window, document } = await setupFrontendApp();

  await seedTransactionDependencies(window, document);

  document.querySelector('[data-route-tab="transactions"]').click();

  await submitTransaction(window, document, {
    date: dates.firstInMonth,
    type: "income",
    amount: 140,
  });

  await submitTransaction(window, document, {
    date: dates.previousMonthLast,
    type: "income",
    amount: 220,
  });

  document.getElementById("transactions-filter-clear-button").click();
  await flush();

  assert.equal(window.location.search.includes("transactionsStartDate="), false);
  assert.equal(window.location.search.includes("transactionsEndDate="), false);
  assert.equal(document.getElementById("transactions-filter-start-date").value, "");
  assert.equal(document.getElementById("transactions-filter-end-date").value, "");

  const rows = document.querySelectorAll("#transactions-body tr");
  assert.equal(rows.length, 2);

  const rowsText = document.getElementById("transactions-body").textContent;
  assert.match(rowsText, new RegExp(dates.firstInMonth));
  assert.match(rowsText, new RegExp(dates.previousMonthLast));

  dom.window.close();
});

test("frontend bank account filter defaults to empty and shows all bank accounts", async () => {
  const dates = getCurrentMonthDateFixtures();
  const { dom, window, document } = await setupFrontendApp();

  await seedTransactionDependencies(window, document);
  await createAdditionalBankAccount(window, document);

  document.querySelector('[data-route-tab="transactions"]').click();

  await submitTransaction(window, document, {
    date: dates.firstInMonth,
    type: "income",
    amount: 40,
    bankAccountID: "1",
  });

  await submitTransaction(window, document, {
    date: dates.secondInMonth,
    type: "income",
    amount: 60,
    bankAccountID: "2",
  });

  const filterElement = document.getElementById("transactions-filter-bank-accounts");
  const selectedOptions = Array.from(filterElement.selectedOptions);
  assert.equal(selectedOptions.length, 0);
  assert.equal(window.location.search.includes("transactionsBankAccounts="), false);

  const rows = document.querySelectorAll("#transactions-body tr");
  assert.equal(rows.length, 2);

  dom.window.close();
});

test("frontend applies valid bank account filter from URL params", async () => {
  const dates = getCurrentMonthDateFixtures();
  const { dom, window, document } = await setupFrontendApp();

  await seedTransactionDependencies(window, document);
  await createAdditionalBankAccount(window, document);

  document.querySelector('[data-route-tab="transactions"]').click();

  const url = new URL(window.location.href);
  url.searchParams.set("transactionsBankAccounts", "1");
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);

  await submitTransaction(window, document, {
    date: dates.firstInMonth,
    type: "income",
    amount: 40,
    bankAccountID: "1",
  });

  await submitTransaction(window, document, {
    date: dates.secondInMonth,
    type: "income",
    amount: 60,
    bankAccountID: "2",
  });

  const rows = document.querySelectorAll("#transactions-body tr");
  assert.equal(rows.length, 1);

  const rowCells = rows[0].querySelectorAll("td");
  assert.match(rowCells[5].textContent, /ACC-001/);

  const selectedOptions = Array.from(document.getElementById("transactions-filter-bank-accounts").selectedOptions);
  assert.deepEqual(selectedOptions.map((option) => option.value), ["1"]);
  assert.equal(new window.URLSearchParams(window.location.search).get("transactionsBankAccounts"), "1");

  dom.window.close();
});

test("frontend falls back to empty bank account filter when URL param is invalid", async () => {
  const dates = getCurrentMonthDateFixtures();
  const { dom, window, document } = await setupFrontendApp({
    initialUrl: "http://localhost:8080/?view=transactions&transactions=list&transactionsBankAccounts=2,invalid",
  });

  await seedTransactionDependencies(window, document);
  await createAdditionalBankAccount(window, document);

  document.querySelector('[data-route-tab="transactions"]').click();

  await submitTransaction(window, document, {
    date: dates.firstInMonth,
    type: "income",
    amount: 40,
    bankAccountID: "1",
  });

  await submitTransaction(window, document, {
    date: dates.secondInMonth,
    type: "income",
    amount: 60,
    bankAccountID: "2",
  });

  const selectedOptions = Array.from(document.getElementById("transactions-filter-bank-accounts").selectedOptions);
  assert.equal(selectedOptions.length, 0);
  assert.equal(window.location.search.includes("transactionsBankAccounts="), false);

  const rows = document.querySelectorAll("#transactions-body tr");
  assert.equal(rows.length, 2);

  dom.window.close();
});

test("frontend bank account multi-select filter updates URL and supports all-accounts fallback", async () => {
  const dates = getCurrentMonthDateFixtures();
  const { dom, window, document } = await setupFrontendApp();

  await seedTransactionDependencies(window, document);
  await createAdditionalBankAccount(window, document);

  document.querySelector('[data-route-tab="transactions"]').click();

  await submitTransaction(window, document, {
    date: dates.firstInMonth,
    type: "income",
    amount: 40,
    bankAccountID: "1",
  });

  await submitTransaction(window, document, {
    date: dates.secondInMonth,
    type: "income",
    amount: 60,
    bankAccountID: "2",
  });

  await setBankAccountFilterSelection(window, document, ["1", "2"]);
  assert.equal(new window.URLSearchParams(window.location.search).get("transactionsBankAccounts"), "1,2");
  assert.equal(document.querySelectorAll("#transactions-body tr").length, 2);

  await setBankAccountFilterSelection(window, document, ["1"]);
  assert.equal(new window.URLSearchParams(window.location.search).get("transactionsBankAccounts"), "1");
  assert.equal(document.querySelectorAll("#transactions-body tr").length, 1);

  const singleRowCells = document.querySelectorAll("#transactions-body tr")[0].querySelectorAll("td");
  assert.match(singleRowCells[5].textContent, /ACC-001/);

  await setBankAccountFilterSelection(window, document, []);
  assert.equal(window.location.search.includes("transactionsBankAccounts="), false);
  assert.equal(document.querySelectorAll("#transactions-body tr").length, 2);

  dom.window.close();
});
