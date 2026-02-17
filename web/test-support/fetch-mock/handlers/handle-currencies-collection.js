const { createResponse, normalize } = require("../../integration-http.js");
const { parseBody, cloneItems, conflict, trimmedValue, upperTrimmedValue } = require("../helpers.js");

function handleCurrenciesCollection(pathname, method, options, stores) {
  if (pathname === "/api/currencies" && method === "GET") {
    return createResponse(200, cloneItems(stores.currenciesStore));
  }

  if (pathname === "/api/currencies" && method === "POST") {
    const payload = parseBody(options);
    const duplicate = stores.currenciesStore.some(
      (item) => normalize(item.name) === normalize(payload.name) || normalize(item.code) === normalize(payload.code)
    );
    if (duplicate) {
      return conflict("duplicate_currency", "name and code must be unique");
    }

    const created = {
      id: stores.nextCurrencyId,
      name: trimmedValue(payload.name),
      code: upperTrimmedValue(payload.code),
    };
    stores.nextCurrencyId += 1;
    stores.currenciesStore.push(created);
    return createResponse(201, created);
  }

  return null;
}

module.exports = { handleCurrenciesCollection };
