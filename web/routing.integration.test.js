const test = require("node:test");
const assert = require("node:assert/strict");

const { setupFrontendApp } = require("./integration-test-setup.js");

test("frontend initializes at Home route and can route to transaction categories, people and currency", async () => {
  const { dom, document } = await setupFrontendApp();

  const homeHidden = document.getElementById("view-home").hidden;
  const transactionCategoriesHiddenBefore = document.getElementById("view-transaction-categories").hidden;
  const peopleHiddenBefore = document.getElementById("view-people").hidden;
  const bankAccountsHiddenBefore = document.getElementById("view-bank-accounts").hidden;
  const currencyHiddenBefore = document.getElementById("view-currency").hidden;

  document.querySelector('[data-route-tab="transaction-categories"]').click();
  const transactionCategoriesHiddenAfter = document.getElementById("view-transaction-categories").hidden;
  const emptyTransactionCategoriesState = document.getElementById("transaction-categories-body").textContent;

  document.querySelector('[data-route-tab="people"]').click();
  const peopleHiddenAfter = document.getElementById("view-people").hidden;
  const emptyPeopleState = document.getElementById("people-body").textContent;

  document.querySelector('[data-route-tab="currency"]').click();

  const currencyHiddenAfter = document.getElementById("view-currency").hidden;
  const emptyState = document.getElementById("currencies-body").textContent;
  const emptyBanksState = document.getElementById("banks-body").textContent;
  const emptyBankAccountsState = document.getElementById("bank-accounts-body").textContent;
  const countryOptions = document.getElementById("bank-country").textContent;
  const bankAccountCurrencyOptions = document.getElementById("bank-account-currency-id").textContent;

  assert.equal(homeHidden, false);
  assert.equal(transactionCategoriesHiddenBefore, true);
  assert.equal(peopleHiddenBefore, true);
  assert.equal(bankAccountsHiddenBefore, true);
  assert.equal(currencyHiddenBefore, true);
  assert.equal(transactionCategoriesHiddenAfter, false);
  assert.equal(peopleHiddenAfter, false);
  assert.equal(currencyHiddenAfter, false);
  assert.match(emptyTransactionCategoriesState, /No transaction categories yet/);
  assert.match(emptyPeopleState, /No people yet/);
  assert.match(emptyState, /No currencies yet/);
  assert.match(emptyBanksState, /No banks yet/);
  assert.match(emptyBankAccountsState, /No bank accounts yet/);
  assert.match(countryOptions, /US - United States/);
  assert.match(bankAccountCurrencyOptions, /Select currency/);

  dom.window.close();
});
