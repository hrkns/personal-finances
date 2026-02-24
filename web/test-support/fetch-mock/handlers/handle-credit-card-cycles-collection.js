const { createResponse } = require("../../integration-http.js");
const {
  parseBody,
  cloneItems,
  conflict,
  invalidPayload,
  trimmedValue,
  isValidISODate,
} = require("../helpers.js");

function handleCreditCardCyclesCollection(pathname, method, options, stores) {
  if (pathname === "/api/credit-card-cycles" && method === "GET") {
    return createResponse(200, cloneItems(stores.creditCardCyclesStore));
  }

  if (pathname === "/api/credit-card-cycles" && method === "POST") {
    const payload = parseBody(options);
    const creditCardID = Number(payload.credit_card_id);
    const closingDate = trimmedValue(payload.closing_date);
    const dueDate = trimmedValue(payload.due_date);

    if (!Number.isInteger(creditCardID) || creditCardID <= 0) {
      return invalidPayload("credit_card_id must be a positive integer");
    }
    if (!stores.creditCardsStore.some((item) => item.id === creditCardID)) {
      return invalidPayload("credit card must exist");
    }
    if (!isValidISODate(closingDate)) {
      return invalidPayload("closing_date must be a valid date in YYYY-MM-DD format");
    }
    if (!isValidISODate(dueDate)) {
      return invalidPayload("due_date must be a valid date in YYYY-MM-DD format");
    }
    if (dueDate < closingDate) {
      return invalidPayload("due_date must be on or after closing_date");
    }

    const duplicate = stores.creditCardCyclesStore.some(
      (item) =>
        item.credit_card_id === creditCardID &&
        item.closing_date === closingDate &&
        item.due_date === dueDate
    );
    if (duplicate) {
      return conflict("duplicate_credit_card_cycle", "credit card cycle already exists");
    }

    const created = {
      id: stores.nextCreditCardCycleId,
      credit_card_id: creditCardID,
      closing_date: closingDate,
      due_date: dueDate,
    };

    stores.nextCreditCardCycleId += 1;
    stores.creditCardCyclesStore.push(created);
    return createResponse(201, created);
  }

  return null;
}

module.exports = { handleCreditCardCyclesCollection };
