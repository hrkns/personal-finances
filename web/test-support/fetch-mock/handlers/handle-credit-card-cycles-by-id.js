const { createResponse } = require("../../integration-http.js");
const {
  parseBody,
  notFound,
  conflict,
  invalidPayload,
  trimmedValue,
} = require("../helpers.js");

function handleCreditCardCyclesByID(pathname, method, options, stores) {
  const cycleMatch = pathname.match(/^\/api\/credit-card-cycles\/(\d+)$/);
  if (!cycleMatch) {
    return null;
  }

  if (method === "PUT") {
    const id = Number(cycleMatch[1]);
    const payload = parseBody(options);
    const creditCardID = Number(payload.credit_card_id);
    const closingDate = trimmedValue(payload.closing_date);
    const dueDate = trimmedValue(payload.due_date);
    const index = stores.creditCardCyclesStore.findIndex((item) => item.id === id);

    if (index === -1) {
      return notFound("credit card cycle not found");
    }
    if (!Number.isInteger(creditCardID) || creditCardID <= 0) {
      return invalidPayload("credit_card_id must be a positive integer");
    }
    if (!closingDate) {
      return invalidPayload("closing_date must be a valid date in YYYY-MM-DD format");
    }
    if (!dueDate) {
      return invalidPayload("due_date must be a valid date in YYYY-MM-DD format");
    }
    if (dueDate < closingDate) {
      return invalidPayload("due_date must be on or after closing_date");
    }

    const duplicate = stores.creditCardCyclesStore.some(
      (item) =>
        item.id !== id &&
        item.credit_card_id === creditCardID &&
        item.closing_date === closingDate &&
        item.due_date === dueDate
    );
    if (duplicate) {
      return conflict("duplicate_credit_card_cycle", "credit card cycle already exists");
    }

    const updated = {
      id,
      credit_card_id: creditCardID,
      closing_date: closingDate,
      due_date: dueDate,
    };

    stores.creditCardCyclesStore[index] = updated;
    return createResponse(200, updated);
  }

  if (method === "DELETE") {
    const id = Number(cycleMatch[1]);
    const index = stores.creditCardCyclesStore.findIndex((item) => item.id === id);
    if (index === -1) {
      return notFound("credit card cycle not found");
    }

    stores.creditCardCyclesStore.splice(index, 1);
    return createResponse(204);
  }

  return null;
}

module.exports = { handleCreditCardCyclesByID };
