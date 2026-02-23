const { createResponse } = require("../../integration-http.js");
const {
  parseBody,
  notFound,
  conflict,
  invalidPayload,
  trimmedValue,
  normalizeNullableName,
  normalizeCurrencyIDs,
  getCurrencyIDsForCreditCard,
} = require("../helpers.js");

function handleCreditCardsByID(pathname, method, options, stores) {
  const creditCardCurrenciesMatch = pathname.match(/^\/api\/credit-cards\/(\d+)\/currencies$/);
  if (creditCardCurrenciesMatch) {
    const creditCardID = Number(creditCardCurrenciesMatch[1]);
    const creditCardExists = stores.creditCardsStore.some((item) => item.id === creditCardID);
    if (!creditCardExists) {
      return notFound("credit card not found");
    }

    if (method === "GET") {
      const items = stores.creditCardCurrenciesStore
        .filter((item) => item.credit_card_id === creditCardID)
        .sort((left, right) => left.currency_id - right.currency_id);

      return createResponse(200, items);
    }

    if (method === "PUT") {
      const payload = parseBody(options);
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

      stores.creditCardCurrenciesStore = stores.creditCardCurrenciesStore.filter(
        (item) => item.credit_card_id !== creditCardID
      );

      const createdItems = currencyIDs
        .map((currencyID) => {
          const created = {
            id: stores.nextCreditCardCurrencyId,
            credit_card_id: creditCardID,
            currency_id: currencyID,
          };
          stores.nextCreditCardCurrencyId += 1;
          stores.creditCardCurrenciesStore.push(created);
          return created;
        });

      return createResponse(200, createdItems);
    }

    return null;
  }

  const creditCardMatch = pathname.match(/^\/api\/credit-cards\/(\d+)$/);
  if (!creditCardMatch) {
    return null;
  }

  if (method === "PUT") {
    const id = Number(creditCardMatch[1]);
    const payload = parseBody(options);
    const number = trimmedValue(payload.number);
    let currencyIDs;
    try {
      currencyIDs = normalizeCurrencyIDs(payload.currency_ids);
    } catch (error) {
      return invalidPayload(error.message);
    }
    const index = stores.creditCardsStore.findIndex((item) => item.id === id);
    if (index === -1) {
      return notFound("credit card not found");
    }

    const duplicate = stores.creditCardsStore.some((item) => item.id !== id && item.number === number);
    if (duplicate) {
      return conflict("duplicate_credit_card", "credit card number must be unique");
    }

    stores.creditCardCurrenciesStore = stores.creditCardCurrenciesStore.filter(
      (item) => item.credit_card_id !== id
    );

    currencyIDs.forEach((currencyID) => {
      stores.creditCardCurrenciesStore.push({
        id: stores.nextCreditCardCurrencyId,
        credit_card_id: id,
        currency_id: currencyID,
      });
      stores.nextCreditCardCurrencyId += 1;
    });

    const updated = {
      id,
      bank_id: Number(payload.bank_id),
      person_id: Number(payload.person_id),
      number,
      name: normalizeNullableName(payload.name),
      currency_ids: getCurrencyIDsForCreditCard(stores, id),
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
    stores.creditCardCurrenciesStore = stores.creditCardCurrenciesStore.filter((item) => item.credit_card_id !== id);
    return createResponse(204);
  }

  return null;
}

module.exports = { handleCreditCardsByID };
