const { createResponse } = require("../../integration-http.js");
const {
  parseBody,
  cloneItems,
  invalidPayload,
  conflict,
  trimmedValue,
} = require("../helpers.js");

function handleCreditCardSubscriptionsCollection(pathname, method, options, stores) {
  if (pathname === "/api/credit-card-subscriptions" && method === "GET") {
    return createResponse(200, cloneItems(stores.creditCardSubscriptionsStore));
  }

  if (pathname === "/api/credit-card-subscriptions" && method === "POST") {
    const payload = parseBody(options);
    const creditCardID = Number(payload.credit_card_id);
    const currencyID = Number(payload.currency_id);
    const concept = trimmedValue(payload.concept);
    const amount = Number(payload.amount);

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
    if (!stores.creditCardsStore.some((item) => item.id === creditCardID)) {
      return invalidPayload("credit card and currency must exist");
    }
    if (!stores.currenciesStore.some((item) => item.id === currencyID)) {
      return invalidPayload("credit card and currency must exist");
    }

    const duplicate = stores.creditCardSubscriptionsStore.some(
      (item) => item.credit_card_id === creditCardID && item.currency_id === currencyID && item.concept === concept
    );
    if (duplicate) {
      return conflict(
        "duplicate_credit_card_subscription",
        "credit card, currency and concept combination must be unique"
      );
    }

    const created = {
      id: stores.nextCreditCardSubscriptionId,
      credit_card_id: creditCardID,
      currency_id: currencyID,
      concept,
      amount,
    };

    stores.nextCreditCardSubscriptionId += 1;
    stores.creditCardSubscriptionsStore.push(created);
    return createResponse(201, created);
  }

  return null;
}

module.exports = { handleCreditCardSubscriptionsCollection };
