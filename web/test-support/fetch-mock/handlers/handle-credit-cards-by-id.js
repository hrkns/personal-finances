const { createResponse } = require("../../integration-http.js");
const { parseBody, notFound, conflict, trimmedValue } = require("../helpers.js");

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
      const currencyIDs = Array.isArray(payload.currency_ids) ? payload.currency_ids : [];

      stores.creditCardCurrenciesStore = stores.creditCardCurrenciesStore.filter(
        (item) => item.credit_card_id !== creditCardID
      );

      const uniqueCurrencyIDs = [...new Set(currencyIDs.map((item) => Number(item)).filter((item) => Number.isInteger(item) && item > 0))];
      const createdItems = uniqueCurrencyIDs
        .sort((left, right) => left - right)
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
    const currencyIDs = normalizeCurrencyIDs(payload.currency_ids);
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
