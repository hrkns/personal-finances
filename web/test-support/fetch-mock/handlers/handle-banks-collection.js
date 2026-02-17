const { createResponse, normalize } = require("../../integration-http.js");
const { parseBody, cloneItems, conflict, trimmedValue, upperTrimmedValue } = require("../helpers.js");

function handleBanksCollection(pathname, method, options, stores) {
  if (pathname === "/api/banks" && method === "GET") {
    return createResponse(200, cloneItems(stores.banksStore));
  }

  if (pathname === "/api/banks" && method === "POST") {
    const payload = parseBody(options);
    const normalizedCountry = normalize(payload.country);
    const duplicate = stores.banksStore.some(
      (item) => normalize(item.name) === normalize(payload.name) && normalize(item.country) === normalizedCountry
    );
    if (duplicate) {
      return conflict("duplicate_bank", "name and country combination must be unique");
    }

    const created = {
      id: stores.nextBankId,
      name: trimmedValue(payload.name),
      country: upperTrimmedValue(payload.country),
    };
    stores.nextBankId += 1;
    stores.banksStore.push(created);
    return createResponse(201, created);
  }

  return null;
}

module.exports = { handleBanksCollection };
