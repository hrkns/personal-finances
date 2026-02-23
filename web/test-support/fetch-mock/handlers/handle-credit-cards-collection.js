const { createResponse } = require("../../integration-http.js");
const { parseBody, cloneItems, conflict, trimmedValue } = require("../helpers.js");

function normalizeNullableName(value) {
  const trimmedName = trimmedValue(value);
  return trimmedName ? trimmedName : null;
}

function normalizeCurrencyIDs(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return [...new Set(value.map((item) => Number(item)).filter((item) => Number.isInteger(item) && item > 0))]
    .sort((left, right) => left - right);
}

function getCurrencyIDsForCreditCard(stores, creditCardID) {
  return stores.creditCardCurrenciesStore
    .filter((item) => item.credit_card_id === creditCardID)
    .map((item) => item.currency_id)
    .sort((left, right) => left - right);
}

function handleCreditCardsCollection(pathname, method, options, stores) {
  if (pathname === "/api/credit-cards" && method === "GET") {
    const items = stores.creditCardsStore.map((item) => ({
      ...item,
      currency_ids: getCurrencyIDsForCreditCard(stores, item.id),
    }));
    return createResponse(200, cloneItems(items));
  }

  if (pathname === "/api/credit-cards" && method === "POST") {
    const payload = parseBody(options);
    const number = trimmedValue(payload.number);
    const currencyIDs = normalizeCurrencyIDs(payload.currency_ids);

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
      currency_ids: [],
    };

    stores.nextCreditCardId += 1;
    stores.creditCardsStore.push(created);

    currencyIDs.forEach((currencyID) => {
      stores.creditCardCurrenciesStore.push({
        id: stores.nextCreditCardCurrencyId,
        credit_card_id: created.id,
        currency_id: currencyID,
      });
      stores.nextCreditCardCurrencyId += 1;
    });

    created.currency_ids = getCurrencyIDsForCreditCard(stores, created.id);
    return createResponse(201, created);
  }

  return null;
}

module.exports = { handleCreditCardsCollection };
