const test = require("node:test");
const assert = require("node:assert/strict");

const { setupFrontendApp } = require("./integration-test-setup.js");

test("frontend initializes at Home route and can route to transactions and settings subviews", async () => {
  const { dom, document } = await setupFrontendApp();

  const homeHidden = document.getElementById("view-home").hidden;
  const transactionCategoriesHiddenBefore = document.getElementById("view-transaction-categories").hidden;
  const transactionsHiddenBefore = document.getElementById("view-transactions").hidden;
  const settingsHiddenBefore = document.getElementById("view-settings").hidden;
  const peopleHiddenBefore = document.getElementById("view-people").hidden;
  const bankAccountsHiddenBefore = document.getElementById("view-bank-accounts").hidden;
  const banksHiddenBefore = document.getElementById("view-banks").hidden;
  const currencyHiddenBefore = document.getElementById("view-currency").hidden;
  const settingsMessageHiddenBefore = document.getElementById("settings-selection-message").hidden;

  document.querySelector('[data-route-tab="settings"]').click();
  document.querySelector('[data-settings-tab="transaction-categories"]').click();
  const transactionCategoriesHiddenAfter = document.getElementById("view-transaction-categories").hidden;
  const emptyTransactionCategoriesState = document.getElementById("transaction-categories-body").textContent;

  document.querySelector('[data-route-tab="transactions"]').click();
  const transactionsHiddenAfter = document.getElementById("view-transactions").hidden;
  const emptyTransactionsState = document.getElementById("transactions-body").textContent;

  document.querySelector('[data-route-tab="settings"]').click();
  const settingsHiddenAfter = document.getElementById("view-settings").hidden;
  const settingsMessageHiddenAfterSettingsOpen = document.getElementById("settings-selection-message").hidden;

  document.querySelector('[data-settings-tab="people"]').click();
  const peopleHiddenAfter = document.getElementById("view-people").hidden;
  const emptyPeopleState = document.getElementById("people-body").textContent;
  const settingsMessageHiddenAfterPeopleSelect = document.getElementById("settings-selection-message").hidden;

  document.querySelector('[data-settings-tab="currency"]').click();

  const banksHiddenAfter = document.getElementById("view-banks").hidden;
  const currencyHiddenAfter = document.getElementById("view-currency").hidden;
  const emptyState = document.getElementById("currencies-body").textContent;
  const emptyBanksState = document.getElementById("banks-body").textContent;
  const emptyBankAccountsState = document.getElementById("bank-accounts-body").textContent;
  const countryOptions = document.getElementById("bank-country").textContent;
  const bankAccountCurrencyOptions = document.getElementById("bank-account-currency-id").textContent;

  assert.equal(homeHidden, false);
  assert.equal(transactionCategoriesHiddenBefore, true);
  assert.equal(transactionsHiddenBefore, true);
  assert.equal(settingsHiddenBefore, true);
  assert.equal(peopleHiddenBefore, true);
  assert.equal(bankAccountsHiddenBefore, true);
  assert.equal(banksHiddenBefore, true);
  assert.equal(currencyHiddenBefore, true);
  assert.equal(settingsMessageHiddenBefore, true);
  assert.equal(transactionCategoriesHiddenAfter, false);
  assert.equal(transactionsHiddenAfter, false);
  assert.equal(settingsHiddenAfter, false);
  assert.equal(settingsMessageHiddenAfterSettingsOpen, false);
  assert.equal(peopleHiddenAfter, false);
  assert.equal(settingsMessageHiddenAfterPeopleSelect, true);
  assert.equal(banksHiddenAfter, true);
  assert.equal(currencyHiddenAfter, false);
  assert.match(emptyTransactionCategoriesState, /No transaction categories yet/);
  assert.match(emptyTransactionsState, /No transactions yet/);
  assert.match(emptyPeopleState, /No people yet/);
  assert.match(emptyState, /No currencies yet/);
  assert.match(emptyBanksState, /No banks yet/);
  assert.match(emptyBankAccountsState, /No bank accounts yet/);
  assert.match(countryOptions, /US - United States/);
  assert.match(bankAccountCurrencyOptions, /Select currency/);

  dom.window.close();
});
