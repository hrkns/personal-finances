const { createResponse } = require("../../integration-http.js");
const { parseBody, notFound, conflict, trimmedValue } = require("../helpers.js");

function normalizeNullableName(value) {
  const trimmedName = trimmedValue(value);
  return trimmedName ? trimmedName : null;
}

function handleCreditCardsByID(pathname, method, options, stores) {
  const creditCardMatch = pathname.match(/^\/api\/credit-cards\/(\d+)$/);
  if (!creditCardMatch) {
    return null;
  }

  if (method === "PUT") {
    const id = Number(creditCardMatch[1]);
    const payload = parseBody(options);
    const number = trimmedValue(payload.number);
    const index = stores.creditCardsStore.findIndex((item) => item.id === id);
    if (index === -1) {
      return notFound("credit card not found");
    }

    const duplicate = stores.creditCardsStore.some((item) => item.id !== id && item.number === number);
    if (duplicate) {
      return conflict("duplicate_credit_card", "credit card number must be unique");
    }

    const updated = {
      id,
      bank_id: Number(payload.bank_id),
      person_id: Number(payload.person_id),
      number,
      name: normalizeNullableName(payload.name),
    };

    stores.creditCardsStore[index] = updated;
    return createResponse(200, updated);
  }

  if (method === "DELETE") {
    const id = Number(creditCardMatch[1]);
    const index = stores.creditCardsStore.findIndex((item) => item.id === id);
    if (index === -1) {
      return notFound("credit card not found");
    }

    stores.creditCardsStore.splice(index, 1);
    return createResponse(204);
  }

  return null;
}

module.exports = { handleCreditCardsByID };
