const { createResponse, normalize } = require("../../integration-http.js");
const { parseBody, notFound, conflict, trimmedValue, upperTrimmedValue } = require("../helpers.js");

function handleCurrenciesByID(pathname, method, options, stores) {
  const currencyMatch = pathname.match(/^\/api\/currencies\/(\d+)$/);
  if (!currencyMatch) {
    return null;
  }

  if (method === "PUT") {
    const id = Number(currencyMatch[1]);
    const payload = parseBody(options);
    const index = stores.currenciesStore.findIndex((item) => item.id === id);
    if (index === -1) {
      return notFound("currency not found");
    }

    const duplicate = stores.currenciesStore.some(
      (item) =>
        item.id !== id &&
        (normalize(item.name) === normalize(payload.name) || normalize(item.code) === normalize(payload.code))
    );
    if (duplicate) {
      return conflict("duplicate_currency", "name and code must be unique");
    }

    const updated = {
      id,
      name: trimmedValue(payload.name),
      code: upperTrimmedValue(payload.code),
    };
    stores.currenciesStore[index] = updated;
    return createResponse(200, updated);
  }

  if (method === "DELETE") {
    const id = Number(currencyMatch[1]);
    const index = stores.currenciesStore.findIndex((item) => item.id === id);
    if (index === -1) {
      return notFound("currency not found");
    }

    stores.currenciesStore.splice(index, 1);
    return createResponse(204);
  }

  return null;
}

module.exports = { handleCurrenciesByID };
