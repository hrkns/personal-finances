const { createResponse } = require("../../integration-http.js");
const {
  parseBody,
  invalidPayload,
  notFound,
  conflict,
  trimmedValue,
} = require("../helpers.js");

function handleCreditCardSubscriptionsByID(pathname, method, options, stores) {
  const match = pathname.match(/^\/api\/credit-card-subscriptions\/(\d+)$/);
  if (!match) {
    return null;
  }

  const id = Number(match[1]);
  const index = stores.creditCardSubscriptionsStore.findIndex((item) => item.id === id);

  if (method === "GET") {
    if (index === -1) {
      return notFound("credit card subscription not found");
    }

    return createResponse(200, { ...stores.creditCardSubscriptionsStore[index] });
  }

  if (method === "PUT") {
    if (index === -1) {
      return notFound("credit card subscription not found");
    }

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
      (item) => item.id !== id && item.credit_card_id === creditCardID && item.currency_id === currencyID && item.concept === concept
    );
    if (duplicate) {
      return conflict(
        "duplicate_credit_card_subscription",
        "credit card, currency and concept combination must be unique"
      );
    }

    const updated = {
      id,
      credit_card_id: creditCardID,
      currency_id: currencyID,
      concept,
      amount,
    };

    stores.creditCardSubscriptionsStore[index] = updated;
    return createResponse(200, updated);
  }

  if (method === "DELETE") {
    if (index === -1) {
      return notFound("credit card subscription not found");
    }

    stores.creditCardSubscriptionsStore.splice(index, 1);
    return createResponse(204);
  }

  return null;
}

module.exports = { handleCreditCardSubscriptionsByID };
