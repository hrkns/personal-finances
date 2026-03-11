const test = require("node:test");
const assert = require("node:assert/strict");

const { setupFrontendApp } = require("../integration-test-setup.js");
const { createStores } = require("../test-support/fetch-mock/helpers.js");
const { handleExpensePaymentsCollection } = require("../test-support/fetch-mock/handlers/handle-expense-payments-collection.js");
const { handleExpensePaymentsByID } = require("../test-support/fetch-mock/handlers/handle-expense-payments-by-id.js");

async function createExpense(document, window, name, frequency) {
  document.querySelector('[data-route-tab="expenses"]').click();
  document.querySelector('[data-expense-tab="expenses"]').click();

  document.getElementById("expense-name").value = name;
  document.getElementById("expense-frequency").value = frequency;
  document
    .getElementById("expense-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
}

async function createCurrency(document, window, name, code) {
  document.querySelector('[data-route-tab="settings"]').click();
  document.querySelector('[data-settings-tab="currencies"]').click();

  document.getElementById("currency-name").value = name;
  document.getElementById("currency-code").value = code;
  document
    .getElementById("currency-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
}

async function openExpensePayments(document) {
  document.querySelector('[data-route-tab="expenses"]').click();
  document.querySelector('[data-expense-tab="payments"]').click();

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const hasExpenseOptions = document.getElementById("expense-payment-expense-id").options.length > 1;
    const hasCurrencyOptions = document.getElementById("expense-payment-currency-id").options.length > 1;
    if (hasExpenseOptions && hasCurrencyOptions) {
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

function selectFirstAvailableOption(selectElement) {
  const firstRealOption = Array.from(selectElement.options).find((option) => option.value);
  if (!firstRealOption) {
    return "";
  }
  selectElement.value = firstRealOption.value;
  return firstRealOption.value;
}

async function readJSON(response) {
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

function seedExpensePaymentStores() {
  const stores = createStores();

  stores.expensesStore.push({ id: 1, name: "Rent", frequency: "monthly" });
  stores.currenciesStore.push({ id: 1, name: "US Dollar", code: "USD" });

  return stores;
}

test("frontend can create and list an expense payment", async () => {
  const { dom, window, document } = await setupFrontendApp();

  await createExpense(document, window, "Rent", "monthly");
  await createCurrency(document, window, "US Dollar", "USD");

  await openExpensePayments(document);
  selectFirstAvailableOption(document.getElementById("expense-payment-expense-id"));
  document.getElementById("expense-payment-amount").value = "100.50";
  selectFirstAvailableOption(document.getElementById("expense-payment-currency-id"));
  document.getElementById("expense-payment-date").value = "2026-03-15";

  document
    .getElementById("expense-payment-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  const message = document.getElementById("expense-payment-form-message").textContent;
  const rowsText = document.getElementById("expense-payments-body").textContent;

  assert.equal(message, "Expense payment created");
  assert.match(rowsText, /Rent/);
  assert.match(rowsText, /100.50/);
  assert.match(rowsText, /2026-03-15/);

  dom.window.close();
});

test("frontend enforces one payment per expense period", async () => {
  const { dom, window, document } = await setupFrontendApp();

  await createExpense(document, window, "Gym", "monthly");
  await createCurrency(document, window, "US Dollar", "USD");

  await openExpensePayments(document);

  selectFirstAvailableOption(document.getElementById("expense-payment-expense-id"));
  document.getElementById("expense-payment-amount").value = "50";
  selectFirstAvailableOption(document.getElementById("expense-payment-currency-id"));
  document.getElementById("expense-payment-date").value = "2026-03-01";
  document
    .getElementById("expense-payment-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  selectFirstAvailableOption(document.getElementById("expense-payment-expense-id"));
  document.getElementById("expense-payment-amount").value = "60";
  selectFirstAvailableOption(document.getElementById("expense-payment-currency-id"));
  document.getElementById("expense-payment-date").value = "2026-03-20";
  document
    .getElementById("expense-payment-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));

  const message = document.getElementById("expense-payment-form-message");
  assert.equal(message.textContent, "an expense payment already exists in the same monthly period");
  assert.equal(message.className, "error");

  dom.window.close();
});

test("frontend supports expense payment edit and delete actions", async () => {
  const { dom, window, document } = await setupFrontendApp();

  await createExpense(document, window, "Fuel", "weekly");
  await createCurrency(document, window, "US Dollar", "USD");

  await openExpensePayments(document);
  selectFirstAvailableOption(document.getElementById("expense-payment-expense-id"));
  document.getElementById("expense-payment-amount").value = "70";
  selectFirstAvailableOption(document.getElementById("expense-payment-currency-id"));
  document.getElementById("expense-payment-date").value = "2026-03-16";
  document
    .getElementById("expense-payment-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  const editButton = document.querySelector('#expense-payments-body button[data-action="edit"]');
  editButton.dispatchEvent(new window.Event("click", { bubbles: true }));

  assert.equal(document.getElementById("expense-payment-submit-button").textContent, "Update");

  document.getElementById("expense-payment-amount").value = "75";
  document.getElementById("expense-payment-date").value = "2026-03-23";
  document
    .getElementById("expense-payment-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.match(document.getElementById("expense-payments-body").textContent, /75.00/);
  assert.match(document.getElementById("expense-payments-body").textContent, /2026-03-23/);

  const deleteButton = document.querySelector('#expense-payments-body button[data-action="delete"]');
  deleteButton.dispatchEvent(new window.Event("click", { bubbles: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.match(document.getElementById("expense-payments-body").textContent, /No expense payments yet/);

  dom.window.close();
});

test("frontend validates expense payment date using YYYY-MM-DD calendar rules", async () => {
  const { dom, window, document } = await setupFrontendApp();

  await createExpense(document, window, "Internet", "monthly");
  await createCurrency(document, window, "US Dollar", "USD");

  await openExpensePayments(document);
  selectFirstAvailableOption(document.getElementById("expense-payment-expense-id"));
  document.getElementById("expense-payment-amount").value = "40";
  selectFirstAvailableOption(document.getElementById("expense-payment-currency-id"));
  document.getElementById("expense-payment-date").value = "2026-02-30";

  document
    .getElementById("expense-payment-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));

  const message = document.getElementById("expense-payment-form-message");
  assert.equal(message.textContent, "date must be a valid date in YYYY-MM-DD format");
  assert.equal(message.className, "error");
  assert.match(document.getElementById("expense-payments-body").textContent, /No expense payments yet/);

  dom.window.close();
});

test("expense payments collection returns 409 conflict for duplicate period on create", async () => {
  const stores = seedExpensePaymentStores();
  stores.expensePaymentsStore.push({
    id: 1,
    expense_id: 1,
    amount: 100,
    currency_id: 1,
    date: "2026-03-05",
  });
  stores.nextExpensePaymentId = 2;

  const response = handleExpensePaymentsCollection(
    "/api/expense-payments",
    "POST",
    {
      body: JSON.stringify({
        expense_id: 1,
        amount: 120,
        currency_id: 1,
        date: "2026-03-20",
      }),
    },
    stores
  );

  assert.ok(response, "expected handler response");
  assert.equal(response.status, 409);

  const body = await readJSON(response);
  assert.equal(body.error.code, "duplicate_expense_payment_period");
  assert.equal(body.error.message, "an expense payment already exists in the same monthly period");
});

test("expense payments by-id returns 409 conflict for duplicate period on update", async () => {
  const stores = seedExpensePaymentStores();
  stores.expensePaymentsStore.push(
    {
      id: 1,
      expense_id: 1,
      amount: 100,
      currency_id: 1,
      date: "2026-03-02",
    },
    {
      id: 2,
      expense_id: 1,
      amount: 80,
      currency_id: 1,
      date: "2026-04-02",
    }
  );

  const response = handleExpensePaymentsByID(
    "/api/expense-payments/2",
    "PUT",
    {
      body: JSON.stringify({
        expense_id: 1,
        amount: 90,
        currency_id: 1,
        date: "2026-03-18",
      }),
    },
    stores
  );

  assert.ok(response, "expected handler response");
  assert.equal(response.status, 409);

  const body = await readJSON(response);
  assert.equal(body.error.code, "duplicate_expense_payment_period");
  assert.equal(body.error.message, "an expense payment already exists in the same monthly period");
});
