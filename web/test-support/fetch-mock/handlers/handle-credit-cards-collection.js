const { createResponse } = require("../../integration-http.js");
const {
  parseBody,
  cloneItems,
  conflict,
  invalidPayload,
  trimmedValue,
  normalizeNullableName,
  normalizeCurrencyIDs,
  getCurrencyIDsForCreditCard,
} = require("../helpers.js");

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
    let currencyIDs;
    try {
      currencyIDs = normalizeCurrencyIDs(payload.currency_ids);
    } catch (error) {
      return invalidPayload(error.message);
    }

    const existingCurrencyIDs = new Set(stores.currenciesStore.map((item) => item.id));
    const allCurrenciesExist = currencyIDs.every((currencyID) => existingCurrencyIDs.has(currencyID));
    if (!allCurrenciesExist) {
      return invalidPayload("all currencies must exist");
    }

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
