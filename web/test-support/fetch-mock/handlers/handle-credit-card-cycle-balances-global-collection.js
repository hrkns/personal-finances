const { createResponse } = require("../../integration-http.js");
const { cloneItems } = require("../helpers.js");

function handleCreditCardCycleBalancesGlobalCollection(pathname, method, _options, stores) {
  if (pathname !== "/api/credit-card-cycle-balances") {
    return null;
  }

  if (method !== "GET") {
    return null;
  }

  return createResponse(200, cloneItems(stores.creditCardCycleBalancesStore));
}

module.exports = { handleCreditCardCycleBalancesGlobalCollection };
