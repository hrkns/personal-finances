const { createResponse, conflict } = require("../../integration-http.js");
const {
  parseBody,
  notFound,
  validateExpensePaymentPayload,
  hasExpensePaymentInSamePeriod,
} = require("../helpers.js");

function handleExpensePaymentsByID(pathname, method, options, stores) {
  const paymentMatch = pathname.match(/^\/api\/expense-payments\/(\d+)$/);
  if (!paymentMatch) {
    return null;
  }

  const id = Number(paymentMatch[1]);
  const index = stores.expensePaymentsStore.findIndex((item) => item.id === id);

  if (method === "GET") {
    if (index === -1) {
      return notFound("expense payment not found");
    }

    return createResponse(200, { ...stores.expensePaymentsStore[index] });
  }

  if (method === "PUT") {
    if (index === -1) {
      return notFound("expense payment not found");
    }

    const parsed = validateExpensePaymentPayload(parseBody(options), stores);
    if (parsed.error) {
      return parsed.error;
    }

    if (hasExpensePaymentInSamePeriod(stores, parsed.payload, id)) {
      return conflict(
        "duplicate_expense_payment_period",
        `an expense payment already exists in the same ${parsed.payload.expense_frequency} period`
      );
    }

    const updated = {
      id,
      expense_id: parsed.payload.expense_id,
      amount: parsed.payload.amount,
      currency_id: parsed.payload.currency_id,
      date: parsed.payload.date,
    };

    stores.expensePaymentsStore[index] = updated;
    return createResponse(200, updated);
  }

  if (method === "DELETE") {
    if (index === -1) {
      return notFound("expense payment not found");
    }

    stores.expensePaymentsStore.splice(index, 1);
    return createResponse(204);
  }

  return null;
}

module.exports = { handleExpensePaymentsByID };
