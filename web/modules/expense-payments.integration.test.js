const test = require("node:test");
const assert = require("node:assert/strict");

const { setupFrontendApp } = require("../integration-test-setup.js");

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
  document.querySelector('[data-settings-tab="currency"]').click();

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

test("frontend can create and list an expense payment", async () => {
  const { dom, window, document } = await setupFrontendApp();

  await createExpense(document, window, "Rent", "monthly");
  await createCurrency(document, window, "US Dollar", "USD");

  await openExpensePayments(document, window);
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

  await openExpensePayments(document, window);

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

  await openExpensePayments(document, window);
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
