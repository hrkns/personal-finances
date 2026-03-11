const test = require("node:test");
const assert = require("node:assert/strict");

const { setupFrontendApp } = require("./integration-test-setup.js");

test("frontend initializes at Home route and can route to transactions and settings subviews", async () => {
  const { dom, document } = await setupFrontendApp();

  const homeHidden = document.getElementById("view-home").hidden;
  const transactionCategoriesHiddenBefore = document.getElementById("view-transaction-categories").hidden;
  const transactionsHiddenBefore = document.getElementById("view-transactions").hidden;
  const creditCardsHiddenBefore = document.getElementById("view-credit-cards").hidden;
  const expensesHiddenBefore = document.getElementById("view-expenses").hidden;
  const settingsHiddenBefore = document.getElementById("view-settings").hidden;
  const peopleHiddenBefore = document.getElementById("view-people").hidden;
  const bankAccountsHiddenBefore = document.getElementById("view-bank-accounts").hidden;
  const banksHiddenBefore = document.getElementById("view-banks").hidden;
  const currencyHiddenBefore = document.getElementById("view-currency").hidden;

  document.querySelector('[data-route-tab="settings"]').click();
  document.querySelector('[data-settings-tab="transaction-categories"]').click();
  const transactionCategoriesHiddenAfter = document.getElementById("view-transaction-categories").hidden;
  const emptyTransactionCategoriesState = document.getElementById("transaction-categories-body").textContent;

  document.querySelector('[data-route-tab="transactions"]').click();
  const transactionsHiddenAfter = document.getElementById("view-transactions").hidden;
  const emptyTransactionsState = document.getElementById("transactions-body").textContent;

  document.querySelector('[data-route-tab="settings"]').click();
  const settingsHiddenAfter = document.getElementById("view-settings").hidden;
  const currencyHiddenAfterSettingsOpen = document.getElementById("view-currency").hidden;

  document.querySelector('[data-settings-tab="people"]').click();
  const peopleHiddenAfter = document.getElementById("view-people").hidden;
  const emptyPeopleState = document.getElementById("people-body").textContent;

  document.querySelector('[data-route-tab="credit-cards"]').click();
  const creditCardsHiddenAfter = document.getElementById("view-credit-cards").hidden;
  const cardsSubViewHiddenAfter = document.getElementById("view-credit-cards-cards").hidden;
  const installmentsSubViewHiddenAfter = document.getElementById("view-credit-card-installments").hidden;
  const balancesSubViewHiddenAfter = document.getElementById("view-credit-card-balances").hidden;
  const cyclesSubViewHiddenAfter = document.getElementById("view-credit-card-cycles").hidden;
  const subscriptionsSubViewHiddenAfter = document.getElementById("view-credit-card-subscriptions").hidden;
  const emptyCreditCardsState = document.getElementById("credit-cards-body").textContent;

  document.querySelector('[data-credit-card-tab="installments"]').click();
  const cardsSubViewHiddenAfterInstallmentSelect = document.getElementById("view-credit-cards-cards").hidden;
  const installmentsSubViewHiddenAfterInstallmentSelect = document.getElementById("view-credit-card-installments").hidden;
  const balancesSubViewHiddenAfterInstallmentSelect = document.getElementById("view-credit-card-balances").hidden;
  const cyclesSubViewHiddenAfterInstallmentSelect = document.getElementById("view-credit-card-cycles").hidden;
  const subscriptionsSubViewHiddenAfterInstallmentSelect = document.getElementById("view-credit-card-subscriptions").hidden;
  const emptyCreditCardInstallmentsState = document.getElementById("credit-card-installments-body").textContent;

  document.querySelector('[data-credit-card-tab="cycles"]').click();
  const cardsSubViewHiddenAfterCycleSelect = document.getElementById("view-credit-cards-cards").hidden;
  const installmentsSubViewHiddenAfterCycleSelect = document.getElementById("view-credit-card-installments").hidden;
  const balancesSubViewHiddenAfterCycleSelect = document.getElementById("view-credit-card-balances").hidden;
  const cyclesSubViewHiddenAfterCycleSelect = document.getElementById("view-credit-card-cycles").hidden;
  const subscriptionsSubViewHiddenAfterCycleSelect = document.getElementById("view-credit-card-subscriptions").hidden;
  const emptyCreditCardCyclesState = document.getElementById("credit-card-cycles-body").textContent;

  document.querySelector('[data-credit-card-tab="balances"]').click();
  const cardsSubViewHiddenAfterBalanceSelect = document.getElementById("view-credit-cards-cards").hidden;
  const installmentsSubViewHiddenAfterBalanceSelect = document.getElementById("view-credit-card-installments").hidden;
  const balancesSubViewHiddenAfterBalanceSelect = document.getElementById("view-credit-card-balances").hidden;
  const cyclesSubViewHiddenAfterBalanceSelect = document.getElementById("view-credit-card-cycles").hidden;
  const subscriptionsSubViewHiddenAfterBalanceSelect = document.getElementById("view-credit-card-subscriptions").hidden;
  const emptyCreditCardBalancesState = document.getElementById("credit-card-cycle-balances-body").textContent;

  document.querySelector('[data-credit-card-tab="subscriptions"]').click();
  const cardsSubViewHiddenAfterSubscriptionSelect = document.getElementById("view-credit-cards-cards").hidden;
  const installmentsSubViewHiddenAfterSubscriptionSelect = document.getElementById("view-credit-card-installments").hidden;
  const balancesSubViewHiddenAfterSubscriptionSelect = document.getElementById("view-credit-card-balances").hidden;
  const cyclesSubViewHiddenAfterSubscriptionSelect = document.getElementById("view-credit-card-cycles").hidden;
  const subscriptionsSubViewHiddenAfterSubscriptionSelect = document.getElementById("view-credit-card-subscriptions").hidden;
  const emptyCreditCardSubscriptionsState = document.getElementById("credit-card-subscriptions-body").textContent;

  document.querySelector('[data-route-tab="expenses"]').click();
  const expensesHiddenAfter = document.getElementById("view-expenses").hidden;
  const expensesExpensesHiddenAfter = document.getElementById("view-expenses-expenses").hidden;
  const expensesPaymentsHiddenAfter = document.getElementById("view-expenses-payments").hidden;
  const emptyExpensesState = document.getElementById("expenses-body").textContent;

  document.querySelector('[data-expense-tab="payments"]').click();
  const expensesExpensesHiddenAfterPaymentsSelect = document.getElementById("view-expenses-expenses").hidden;
  const expensesPaymentsHiddenAfterPaymentsSelect = document.getElementById("view-expenses-payments").hidden;
  const emptyExpensePaymentsState = document.getElementById("expense-payments-body").textContent;

  document.querySelector('[data-route-tab="settings"]').click();
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
  assert.equal(creditCardsHiddenBefore, true);
  assert.equal(expensesHiddenBefore, true);
  assert.equal(banksHiddenBefore, true);
  assert.equal(currencyHiddenBefore, true);
  assert.equal(transactionCategoriesHiddenAfter, false);
  assert.equal(transactionsHiddenAfter, false);
  assert.equal(settingsHiddenAfter, false);
  assert.equal(currencyHiddenAfterSettingsOpen, false);
  assert.equal(peopleHiddenAfter, false);
  assert.equal(banksHiddenAfter, true);
  assert.equal(currencyHiddenAfter, false);
  assert.match(emptyTransactionCategoriesState, /No transaction categories yet/);
  assert.match(emptyTransactionsState, /No transactions yet/);
  assert.match(emptyPeopleState, /No people yet/);
  assert.match(emptyState, /No currencies yet/);
  assert.match(emptyBanksState, /No banks yet/);
  assert.match(emptyBankAccountsState, /No bank accounts yet/);

  assert.equal(creditCardsHiddenAfter, false);
  assert.equal(cardsSubViewHiddenAfter, false);
  assert.equal(balancesSubViewHiddenAfter, true);
  assert.equal(installmentsSubViewHiddenAfter, true);
  assert.equal(cyclesSubViewHiddenAfter, true);
  assert.equal(subscriptionsSubViewHiddenAfter, true);
  assert.equal(cardsSubViewHiddenAfterInstallmentSelect, true);
  assert.equal(balancesSubViewHiddenAfterInstallmentSelect, true);
  assert.equal(installmentsSubViewHiddenAfterInstallmentSelect, false);
  assert.equal(cyclesSubViewHiddenAfterInstallmentSelect, true);
  assert.equal(subscriptionsSubViewHiddenAfterInstallmentSelect, true);
  assert.equal(cardsSubViewHiddenAfterCycleSelect, true);
  assert.equal(installmentsSubViewHiddenAfterCycleSelect, true);
  assert.equal(balancesSubViewHiddenAfterCycleSelect, true);
  assert.equal(cyclesSubViewHiddenAfterCycleSelect, false);
  assert.equal(subscriptionsSubViewHiddenAfterCycleSelect, true);
  assert.equal(cardsSubViewHiddenAfterBalanceSelect, true);
  assert.equal(installmentsSubViewHiddenAfterBalanceSelect, true);
  assert.equal(balancesSubViewHiddenAfterBalanceSelect, false);
  assert.equal(cyclesSubViewHiddenAfterBalanceSelect, true);
  assert.equal(subscriptionsSubViewHiddenAfterBalanceSelect, true);
  assert.equal(cardsSubViewHiddenAfterSubscriptionSelect, true);
  assert.equal(installmentsSubViewHiddenAfterSubscriptionSelect, true);
  assert.equal(balancesSubViewHiddenAfterSubscriptionSelect, true);
  assert.equal(cyclesSubViewHiddenAfterSubscriptionSelect, true);
  assert.equal(subscriptionsSubViewHiddenAfterSubscriptionSelect, false);
  assert.match(emptyCreditCardsState, /No credit cards yet/);
  assert.match(emptyCreditCardBalancesState, /No credit card cycle balances yet/);
  assert.match(emptyCreditCardInstallmentsState, /No credit card installments yet/);
  assert.match(emptyCreditCardCyclesState, /No credit card cycles yet/);
  assert.match(emptyCreditCardSubscriptionsState, /No credit card subscriptions yet/);
  assert.equal(expensesHiddenAfter, false);
  assert.equal(expensesExpensesHiddenAfter, false);
  assert.equal(expensesPaymentsHiddenAfter, true);
  assert.equal(expensesExpensesHiddenAfterPaymentsSelect, true);
  assert.equal(expensesPaymentsHiddenAfterPaymentsSelect, false);
  assert.match(emptyExpensesState, /No expenses yet/);
  assert.match(emptyExpensePaymentsState, /No expense payments yet/);
  assert.match(countryOptions, /US - United States/);
  assert.match(bankAccountCurrencyOptions, /Select currency/);

  dom.window.close();
});
