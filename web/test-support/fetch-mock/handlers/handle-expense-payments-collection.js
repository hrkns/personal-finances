const { createResponse, conflict } = require("../../integration-http.js");
const {
  cloneItems,
  parseBody,
  validateExpensePaymentPayload,
  hasExpensePaymentInSamePeriod,
} = require("../helpers.js");

function handleExpensePaymentsCollection(pathname, method, options, stores) {
  if (pathname === "/api/expense-payments" && method === "GET") {
    return createResponse(200, cloneItems(stores.expensePaymentsStore));
  }

  if (pathname === "/api/expense-payments" && method === "POST") {
    const parsed = validateExpensePaymentPayload(parseBody(options), stores);
    if (parsed.error) {
      return parsed.error;
    }

    if (hasExpensePaymentInSamePeriod(stores, parsed.payload)) {
      return conflict(
        "duplicate_expense_payment_period",
        `an expense payment already exists in the same ${parsed.payload.expense_frequency} period`
      );
    }

    const created = {
      id: stores.nextExpensePaymentId,
      expense_id: parsed.payload.expense_id,
      amount: parsed.payload.amount,
      currency_id: parsed.payload.currency_id,
      date: parsed.payload.date,
    };

    stores.nextExpensePaymentId += 1;
    stores.expensePaymentsStore.push(created);
    return createResponse(201, created);
  }

  return null;
}

module.exports = { handleExpensePaymentsCollection };
