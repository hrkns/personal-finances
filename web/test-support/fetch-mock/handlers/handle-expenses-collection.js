const { createResponse, normalize } = require("../../integration-http.js");
const { parseBody, cloneItems, conflict, validateExpensePayload } = require("../helpers.js");

function handleExpensesCollection(pathname, method, options, stores) {
  if (pathname === "/api/expenses" && method === "GET") {
    return createResponse(200, cloneItems(stores.expensesStore));
  }

  if (pathname === "/api/expenses" && method === "POST") {
    const parsed = validateExpensePayload(parseBody(options));
    if (parsed.error) {
      return parsed.error;
    }

    const duplicate = stores.expensesStore.some((item) => normalize(item.name) === normalize(parsed.payload.name));
    if (duplicate) {
      return conflict("duplicate_expense", "expense name must be unique");
    }

    const created = {
      id: stores.nextExpenseId,
      name: parsed.payload.name,
      frequency: parsed.payload.frequency,
    };
    stores.nextExpenseId += 1;
    stores.expensesStore.push(created);
    return createResponse(201, created);
  }

  return null;
}

module.exports = { handleExpensesCollection };
