const { createResponse } = require("./integration-http.js");
const { createStores } = require("./fetch-mock/helpers.js");
const { handleTransactionCategoriesCollection } = require("./fetch-mock/handlers/handle-transaction-categories-collection.js");
const { handleTransactionCategoriesByID } = require("./fetch-mock/handlers/handle-transaction-categories-by-id.js");
const { handleCountries } = require("./fetch-mock/handlers/handle-countries.js");
const { handleCurrenciesCollection } = require("./fetch-mock/handlers/handle-currencies-collection.js");
const { handleCurrenciesByID } = require("./fetch-mock/handlers/handle-currencies-by-id.js");
const { handlePeopleCollection } = require("./fetch-mock/handlers/handle-people-collection.js");
const { handlePeopleByID } = require("./fetch-mock/handlers/handle-people-by-id.js");
const { handleBanksCollection } = require("./fetch-mock/handlers/handle-banks-collection.js");
const { handleBanksByID } = require("./fetch-mock/handlers/handle-banks-by-id.js");
const { handleBankAccountsCollection } = require("./fetch-mock/handlers/handle-bank-accounts-collection.js");
const { handleBankAccountsByID } = require("./fetch-mock/handlers/handle-bank-accounts-by-id.js");
const { handleCreditCardsCollection } = require("./fetch-mock/handlers/handle-credit-cards-collection.js");
const { handleCreditCardsByID } = require("./fetch-mock/handlers/handle-credit-cards-by-id.js");
const { handleCreditCardInstallmentsCollection } = require("./fetch-mock/handlers/handle-credit-card-installments-collection.js");
const { handleCreditCardInstallmentsByID } = require("./fetch-mock/handlers/handle-credit-card-installments-by-id.js");
const { handleCreditCardSubscriptionsCollection } = require("./fetch-mock/handlers/handle-credit-card-subscriptions-collection.js");
const { handleCreditCardSubscriptionsByID } = require("./fetch-mock/handlers/handle-credit-card-subscriptions-by-id.js");
const { handleCreditCardCyclesCollection } = require("./fetch-mock/handlers/handle-credit-card-cycles-collection.js");
const { handleCreditCardCyclesByID } = require("./fetch-mock/handlers/handle-credit-card-cycles-by-id.js");
const { handleCreditCardCycleBalancesCollection } = require("./fetch-mock/handlers/handle-credit-card-cycle-balances-collection.js");
const { handleCreditCardCycleBalancesByID } = require("./fetch-mock/handlers/handle-credit-card-cycle-balances-by-id.js");
const { handleTransactionsCollection } = require("./fetch-mock/handlers/handle-transactions-collection.js");
const { handleTransactionsByID } = require("./fetch-mock/handlers/handle-transactions-by-id.js");

const handlers = [
  handleTransactionCategoriesCollection,
  handleTransactionCategoriesByID,
  handleCountries,
  handleCurrenciesCollection,
  handleCurrenciesByID,
  handlePeopleCollection,
  handlePeopleByID,
  handleBanksCollection,
  handleBanksByID,
  handleBankAccountsCollection,
  handleBankAccountsByID,
  handleCreditCardsCollection,
  handleCreditCardsByID,
  handleCreditCardInstallmentsCollection,
  handleCreditCardInstallmentsByID,
  handleCreditCardSubscriptionsCollection,
  handleCreditCardSubscriptionsByID,
  handleCreditCardCyclesCollection,
  handleCreditCardCyclesByID,
  handleCreditCardCycleBalancesCollection,
  handleCreditCardCycleBalancesByID,
  handleTransactionsCollection,
  handleTransactionsByID,
];

function createFetchMock() {
  const stores = createStores();

  return async (url, options = {}) => {
    const method = (options.method || "GET").toUpperCase();
    const parsedUrl = new URL(url, "http://localhost:8080");
    const pathname = parsedUrl.pathname;

    for (const handler of handlers) {
      const response = handler(pathname, method, options, stores);
      if (response) {
        return response;
      }
    }

    return createResponse(500, { error: { code: "unhandled", message: "unhandled route in test" } });
  };
}

module.exports = {
  createFetchMock,
};
