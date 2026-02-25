const { createResponse } = require("../../integration-http.js");
const {
  parseBody,
  conflict,
  notFound,
  invalidPayload,
} = require("../helpers.js");

function handleCreditCardCycleBalancesByID(pathname, method, options, stores) {
  const byIDMatch = pathname.match(/^\/api\/credit-card-cycles\/(\d+)\/balances\/(\d+)$/);
  if (!byIDMatch) {
    return null;
  }

  const cycleID = Number(byIDMatch[1]);
  const balanceID = Number(byIDMatch[2]);

  const index = stores.creditCardCycleBalancesStore.findIndex(
    (item) => item.id === balanceID && item.credit_card_cycle_id === cycleID
  );

  if (method === "GET") {
    if (index === -1) {
      return notFound("credit card cycle balance not found");
    }

    return createResponse(200, { ...stores.creditCardCycleBalancesStore[index] });
  }

  if (method === "PUT") {
    if (index === -1) {
      return notFound("credit card cycle balance not found");
    }

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
      (item) => item.id !== balanceID && item.credit_card_cycle_id === creditCardCycleID && item.currency_id === currencyID
    );
    if (hasDuplicateCycleCurrency) {
      return conflict("duplicate_credit_card_cycle_balance", "credit card cycle and currency combination must be unique");
    }

    const updated = {
      id: balanceID,
      credit_card_cycle_id: creditCardCycleID,
      currency_id: currencyID,
      balance,
      paid,
    };

    stores.creditCardCycleBalancesStore[index] = updated;
    return createResponse(200, updated);
  }

  if (method === "DELETE") {
    if (index === -1) {
      return notFound("credit card cycle balance not found");
    }

    stores.creditCardCycleBalancesStore.splice(index, 1);
    return createResponse(204);
  }

  return null;
}

module.exports = { handleCreditCardCycleBalancesByID };
