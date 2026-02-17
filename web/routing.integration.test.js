const test = require("node:test");
const assert = require("node:assert/strict");

const { setupFrontendApp } = require("./integration-test-setup.js");

test("frontend initializes at Home route and can route to Currency", async () => {
  const { dom, document } = await setupFrontendApp();

  const homeHidden = document.getElementById("view-home").hidden;
  const bankAccountsHiddenBefore = document.getElementById("view-bank-accounts").hidden;
  const currencyHiddenBefore = document.getElementById("view-currency").hidden;

  document.querySelector('[data-route-tab="currency"]').click();

  const currencyHiddenAfter = document.getElementById("view-currency").hidden;
  const emptyState = document.getElementById("currencies-body").textContent;
  const emptyBanksState = document.getElementById("banks-body").textContent;
  const emptyBankAccountsState = document.getElementById("bank-accounts-body").textContent;
  const countryOptions = document.getElementById("bank-country").textContent;
  const bankAccountCurrencyOptions = document.getElementById("bank-account-currency-id").textContent;

  assert.equal(homeHidden, false);
  assert.equal(bankAccountsHiddenBefore, true);
  assert.equal(currencyHiddenBefore, true);
  assert.equal(currencyHiddenAfter, false);
  assert.match(emptyState, /No currencies yet/);
  assert.match(emptyBanksState, /No banks yet/);
  assert.match(emptyBankAccountsState, /No bank accounts yet/);
  assert.match(countryOptions, /US - United States/);
  assert.match(bankAccountCurrencyOptions, /Select currency/);

  dom.window.close();
});
