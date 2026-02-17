const { createResponse, normalize } = require("../../integration-http.js");
const { parseBody, notFound, conflict, trimmedValue, upperTrimmedValue } = require("../helpers.js");

function handleBanksByID(pathname, method, options, stores) {
  const bankMatch = pathname.match(/^\/api\/banks\/(\d+)$/);
  if (!bankMatch) {
    return null;
  }

  if (method === "PUT") {
    const id = Number(bankMatch[1]);
    const payload = parseBody(options);
    const index = stores.banksStore.findIndex((item) => item.id === id);
    if (index === -1) {
      return notFound("bank not found");
    }

    const duplicate = stores.banksStore.some(
      (item) =>
        item.id !== id &&
        normalize(item.name) === normalize(payload.name) &&
        normalize(item.country) === normalize(payload.country)
    );
    if (duplicate) {
      return conflict("duplicate_bank", "name and country combination must be unique");
    }

    const updated = {
      id,
      name: trimmedValue(payload.name),
      country: upperTrimmedValue(payload.country),
    };
    stores.banksStore[index] = updated;
    return createResponse(200, updated);
  }

  if (method === "DELETE") {
    const id = Number(bankMatch[1]);
    const index = stores.banksStore.findIndex((item) => item.id === id);
    if (index === -1) {
      return notFound("bank not found");
    }

    stores.banksStore.splice(index, 1);
    return createResponse(204);
  }

  return null;
}

module.exports = { handleBanksByID };
