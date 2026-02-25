const { createResponse } = require("../../integration-http.js");
const {
  parseBody,
  cloneItems,
  conflict,
  invalidPayload,
} = require("../helpers.js");

function handleCreditCardCycleBalancesCollection(pathname, method, options, stores) {
  const collectionMatch = pathname.match(/^\/api\/credit-card-cycles\/(\d+)\/balances$/);
  if (!collectionMatch) {
    return null;
  }

  const cycleID = Number(collectionMatch[1]);

  if (method === "GET") {
    if (!stores.creditCardCyclesStore.some((item) => item.id === cycleID)) {
      return createResponse(404, {
        error: {
          code: "not_found",
          message: "credit card cycle not found",
        },
      });
    }

    const items = stores.creditCardCycleBalancesStore.filter((item) => item.credit_card_cycle_id === cycleID);
    return createResponse(200, cloneItems(items));
  }

  if (method === "POST") {
    const payload = parseBody(options);
    const creditCardCycleID = Number(payload.credit_card_cycle_id);
    const currencyID = Number(payload.currency_id);
    const hasBalance = Object.prototype.hasOwnProperty.call(payload, "balance");
    const hasPaid = Object.prototype.hasOwnProperty.call(payload, "paid");

    let balance = 0;
    if (hasBalance) {
      balance = Number(payload.balance);
    }

    let paid = false;
    if (hasPaid) {
      paid = payload.paid;
    }

    if (!Number.isInteger(creditCardCycleID) || creditCardCycleID <= 0) {
      return invalidPayload("credit_card_cycle_id must be a positive integer");
    }
    if (creditCardCycleID !== cycleID) {
      return invalidPayload("credit_card_cycle_id must match route id");
    }
    if (!Number.isInteger(currencyID) || currencyID <= 0) {
      return invalidPayload("currency_id must be a positive integer");
    }
    if (!stores.creditCardCyclesStore.some((item) => item.id === creditCardCycleID)) {
      return invalidPayload("credit card cycle and currency must exist");
    }
    if (!stores.currenciesStore.some((item) => item.id === currencyID)) {
      return invalidPayload("credit card cycle and currency must exist");
    }
    if (Number.isNaN(balance)) {
      return invalidPayload("balance must be a valid number");
    }
    if (hasPaid && typeof paid !== "boolean") {
      return invalidPayload("paid must be a boolean");
    }

    const hasDuplicateCycleCurrency = stores.creditCardCycleBalancesStore.some(
      (item) => item.credit_card_cycle_id === creditCardCycleID && item.currency_id === currencyID
    );
    if (hasDuplicateCycleCurrency) {
      return conflict("duplicate_credit_card_cycle_balance", "credit card cycle and currency combination must be unique");
    }

    const created = {
      id: stores.nextCreditCardCycleBalanceId,
      credit_card_cycle_id: creditCardCycleID,
      currency_id: currencyID,
      balance,
      paid,
    };

    stores.nextCreditCardCycleBalanceId += 1;
    stores.creditCardCycleBalancesStore.push(created);
    return createResponse(201, created);
  }

  return null;
}

module.exports = { handleCreditCardCycleBalancesCollection };
