const { createResponse } = require("../../integration-http.js");
const {
  parseBody,
  cloneItems,
  invalidPayload,
  conflict,
  trimmedValue,
  isValidISODate,
} = require("../helpers.js");

function handleCreditCardInstallmentsCollection(pathname, method, options, stores) {
  if (pathname === "/api/credit-card-installments" && method === "GET") {
    return createResponse(200, cloneItems(stores.creditCardInstallmentsStore));
  }

  if (pathname === "/api/credit-card-installments" && method === "POST") {
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
      (item) => item.credit_card_id === creditCardID && item.concept === concept
    );
    if (duplicate) {
      return conflict("duplicate_credit_card_installment", "credit card and concept combination must be unique");
    }

    const created = {
      id: stores.nextCreditCardInstallmentId,
      credit_card_id: creditCardID,
      currency_id: currencyID,
      concept,
      amount,
      start_date: startDate,
      count,
    };

    stores.nextCreditCardInstallmentId += 1;
    stores.creditCardInstallmentsStore.push(created);
    return createResponse(201, created);
  }

  return null;
}

module.exports = { handleCreditCardInstallmentsCollection };
