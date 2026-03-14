const test = require("node:test");
const assert = require("node:assert/strict");

const { setupFrontendApp } = require("../integration-test-setup.js");
const { createStores, assertConflict } = require("../test-support/fetch-mock/helpers.js");
const { handleBankAccountsCollection } = require("../test-support/fetch-mock/handlers/handle-bank-accounts-collection.js");
const { handleBankAccountsByID } = require("../test-support/fetch-mock/handlers/handle-bank-accounts-by-id.js");

test("frontend can create and list a bank account", async () => {
  const { dom, window, document } = await setupFrontendApp();

  document.querySelector('[data-route-tab="settings"]').click();
  document.querySelector('[data-settings-tab="bank-accounts"]').click();

  document.getElementById("currency-name").value = "US Dollar";
  document.getElementById("currency-code").value = "usd";
  document
    .getElementById("currency-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  document.getElementById("bank-name").value = "Home Bank";
  document.getElementById("bank-country").value = "US";
  document
    .getElementById("bank-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  document.getElementById("bank-account-bank-id").value = "1";
  document.getElementById("bank-account-currency-id").value = "1";
  document.getElementById("bank-account-number").value = "ACC-123";
  document.getElementById("bank-account-balance").value = "12.34";
  document
    .getElementById("bank-account-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  const message = document.getElementById("bank-account-form-message").textContent;
  const rowsText = document.getElementById("bank-accounts-body").textContent;

  assert.equal(message, "Bank account created");
  assert.match(rowsText, /Home Bank/);
  assert.match(rowsText, /USD/);
  assert.match(rowsText, /ACC-123/);

  dom.window.close();
});

test("frontend supports bank account edit and delete actions", async () => {
  const { dom, window, document } = await setupFrontendApp();

  document.querySelector('[data-route-tab="settings"]').click();
  document.querySelector('[data-settings-tab="bank-accounts"]').click();

  document.getElementById("currency-name").value = "US Dollar";
  document.getElementById("currency-code").value = "usd";
  document
    .getElementById("currency-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  document.getElementById("bank-name").value = "Edit Account Bank";
  document.getElementById("bank-country").value = "US";
  document
    .getElementById("bank-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  document.getElementById("bank-account-bank-id").value = "1";
  document.getElementById("bank-account-currency-id").value = "1";
  document.getElementById("bank-account-number").value = "EDIT-1";
  document.getElementById("bank-account-balance").value = "10";
  document
    .getElementById("bank-account-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  const editButton = document.querySelector('#bank-accounts-body button[data-action="edit"]');
  editButton.dispatchEvent(new window.Event("click", { bubbles: true }));

  assert.equal(document.getElementById("bank-account-submit-button").textContent, "Update");
  assert.equal(document.getElementById("bank-account-cancel-button").hidden, false);

  document.getElementById("bank-account-number").value = "EDIT-2";
  document.getElementById("bank-account-balance").value = "20.55";
  document
    .getElementById("bank-account-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.match(document.getElementById("bank-accounts-body").textContent, /EDIT-2/);

  const deleteButton = document.querySelector('#bank-accounts-body button[data-action="delete"]');
  deleteButton.dispatchEvent(new window.Event("click", { bubbles: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.match(document.getElementById("bank-accounts-body").textContent, /No bank accounts yet/);

  dom.window.close();
});

test("frontend shows error message on duplicate bank account conflict", async () => {
  const { dom, window, document } = await setupFrontendApp();

  document.querySelector('[data-route-tab="settings"]').click();
  document.querySelector('[data-settings-tab="bank-accounts"]').click();

  document.getElementById("currency-name").value = "US Dollar";
  document.getElementById("currency-code").value = "usd";
  document
    .getElementById("currency-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  document.getElementById("bank-name").value = "Conflict Account Bank";
  document.getElementById("bank-country").value = "US";
  document
    .getElementById("bank-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  document.getElementById("bank-account-bank-id").value = "1";
  document.getElementById("bank-account-currency-id").value = "1";
  document.getElementById("bank-account-number").value = "DUP-1";
  document.getElementById("bank-account-balance").value = "10";
  document
    .getElementById("bank-account-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  document.getElementById("bank-account-bank-id").value = "1";
  document.getElementById("bank-account-currency-id").value = "1";
  document.getElementById("bank-account-number").value = "DUP-1";
  document.getElementById("bank-account-balance").value = "11";
  document
    .getElementById("bank-account-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  const message = document.getElementById("bank-account-form-message");
  assert.equal(message.textContent, "bank, currency and account number combination must be unique");
  assert.equal(message.className, "error");

  dom.window.close();
});

test("bank accounts collection conflict path", async () => {
  const stores = createStores();
  stores.bankAccountsStore.push({ id: 1, bank_id: 1, currency_id: 1, account_number: "ACC-1", balance: 0 });

  const response = handleBankAccountsCollection(
    "/api/bank-accounts",
    "POST",
    { body: JSON.stringify({ bank_id: 1, currency_id: 1, account_number: "ACC-1", balance: 10 }) },
    stores
  );

  await assertConflict(response, "duplicate_bank_account", "bank, currency and account number combination must be unique");
});

test("bank accounts by-id conflict path", async () => {
  const stores = createStores();
  stores.bankAccountsStore.push(
    { id: 1, bank_id: 1, currency_id: 1, account_number: "ACC-1", balance: 0 },
    { id: 2, bank_id: 2, currency_id: 1, account_number: "ACC-2", balance: 0 }
  );

  const response = handleBankAccountsByID(
    "/api/bank-accounts/2",
    "PUT",
    { body: JSON.stringify({ bank_id: 1, currency_id: 1, account_number: "ACC-1", balance: 5 }) },
    stores
  );

  await assertConflict(response, "duplicate_bank_account", "bank, currency and account number combination must be unique");
});
