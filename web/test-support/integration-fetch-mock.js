const { createResponse } = require("./integration-http.js");
const { createStores } = require("./fetch-mock/helpers.js");
const { handleCountries } = require("./fetch-mock/handlers/handle-countries.js");
const { handleCurrenciesCollection } = require("./fetch-mock/handlers/handle-currencies-collection.js");
const { handleCurrenciesByID } = require("./fetch-mock/handlers/handle-currencies-by-id.js");
const { handlePeopleCollection } = require("./fetch-mock/handlers/handle-people-collection.js");
const { handlePeopleByID } = require("./fetch-mock/handlers/handle-people-by-id.js");
const { handleBanksCollection } = require("./fetch-mock/handlers/handle-banks-collection.js");
const { handleBanksByID } = require("./fetch-mock/handlers/handle-banks-by-id.js");
const { handleBankAccountsCollection } = require("./fetch-mock/handlers/handle-bank-accounts-collection.js");
const { handleBankAccountsByID } = require("./fetch-mock/handlers/handle-bank-accounts-by-id.js");

const handlers = [
  handleCountries,
  handleCurrenciesCollection,
  handleCurrenciesByID,
  handlePeopleCollection,
  handlePeopleByID,
  handleBanksCollection,
  handleBanksByID,
  handleBankAccountsCollection,
  handleBankAccountsByID,
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
