const { createResponse } = require("../../integration-http.js");
const { parseBody, cloneItems, conflict, trimmedValue } = require("../helpers.js");

function normalizeNullableName(value) {
  const trimmedName = trimmedValue(value);
  return trimmedName ? trimmedName : null;
}

function handleCreditCardsCollection(pathname, method, options, stores) {
  if (pathname === "/api/credit-cards" && method === "GET") {
    return createResponse(200, cloneItems(stores.creditCardsStore));
  }

  if (pathname === "/api/credit-cards" && method === "POST") {
    const payload = parseBody(options);
    const number = trimmedValue(payload.number);

    const duplicate = stores.creditCardsStore.some((item) => item.number === number);
    if (duplicate) {
      return conflict("duplicate_credit_card", "credit card number must be unique");
    }

    const created = {
      id: stores.nextCreditCardId,
      bank_id: Number(payload.bank_id),
      person_id: Number(payload.person_id),
      number,
      name: normalizeNullableName(payload.name),
    };

    stores.nextCreditCardId += 1;
    stores.creditCardsStore.push(created);
    return createResponse(201, created);
  }

  return null;
}

module.exports = { handleCreditCardsCollection };
