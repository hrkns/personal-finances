const { createResponse } = require("../../integration-http.js");
const {
  parseBody,
  invalidPayload,
  notFound,
  conflict,
  trimmedValue,
  isValidISODate,
} = require("../helpers.js");

function handleCreditCardInstallmentsByID(pathname, method, options, stores) {
  const match = pathname.match(/^\/api\/credit-card-installments\/(\d+)$/);
  if (!match) {
    return null;
  }

  const id = Number(match[1]);
  const index = stores.creditCardInstallmentsStore.findIndex((item) => item.id === id);

  if (method === "GET") {
    if (index === -1) {
      return notFound("credit card installment not found");
    }

    return createResponse(200, { ...stores.creditCardInstallmentsStore[index] });
  }

  if (method === "PUT") {
    if (index === -1) {
      return notFound("credit card installment not found");
    }

    const payload = parseBody(options);
    const creditCardID = Number(payload.credit_card_id);
    const currencyID = Number(payload.currency_id);
    const concept = trimmedValue(payload.concept);
    const amount = Number(payload.amount);
    const startDate = trimmedValue(payload.start_date);
    const count = Number(payload.count);

    if (!Number.isInteger(creditCardID) || creditCardID <= 0) {
      return invalidPayload("credit_card_id must be a positive integer");
    }
    if (!Number.isInteger(currencyID) || currencyID <= 0) {
      return invalidPayload("currency_id must be a positive integer");
    }
    if (concept === "") {
      return invalidPayload("concept is required");
    }
    if (!(amount > 0)) {
      return invalidPayload("amount must be greater than zero");
    }
    if (!isValidISODate(startDate)) {
      return invalidPayload("start_date must be a valid date in YYYY-MM-DD format");
    }
    if (!Number.isInteger(count) || count <= 0) {
      return invalidPayload("count must be greater than zero");
    }
    if (!stores.creditCardsStore.some((item) => item.id === creditCardID)) {
      return invalidPayload("credit card and currency must exist");
    }
    if (!stores.currenciesStore.some((item) => item.id === currencyID)) {
      return invalidPayload("credit card and currency must exist");
    }

    const duplicate = stores.creditCardInstallmentsStore.some(
      (item) => item.id !== id && item.credit_card_id === creditCardID && item.currency_id === currencyID && item.concept === concept
    );
    if (duplicate) {
      return conflict("duplicate_credit_card_installment", "credit card, currency and concept combination must be unique");
    }

    const updated = {
      id,
      credit_card_id: creditCardID,
      currency_id: currencyID,
      concept,
      amount,
      start_date: startDate,
      count,
    };

    stores.creditCardInstallmentsStore[index] = updated;
    return createResponse(200, updated);
  }

  if (method === "DELETE") {
    if (index === -1) {
      return notFound("credit card installment not found");
    }

    stores.creditCardInstallmentsStore.splice(index, 1);
    return createResponse(204);
  }

  return null;
}

module.exports = { handleCreditCardInstallmentsByID };
