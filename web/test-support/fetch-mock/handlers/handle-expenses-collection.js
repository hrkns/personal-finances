const { createResponse, normalize } = require("../../integration-http.js");
const { parseBody, cloneItems, conflict, invalidPayload, trimmedValue } = require("../helpers.js");

const validFrequencies = new Set(["daily", "weekly", "monthly", "annually"]);

function normalizeFrequency(value) {
  return String(value ?? "").trim().toLowerCase();
}

function validateExpensePayload(payload) {
  const name = trimmedValue(payload.name);
  const frequency = normalizeFrequency(payload.frequency);

  if (!name) {
    return { error: invalidPayload("name is required") };
  }

  if (!frequency) {
    return { error: invalidPayload("frequency is required") };
  }

  if (!validFrequencies.has(frequency)) {
    return { error: invalidPayload("frequency must be one of: daily, weekly, monthly, annually") };
  }

  return { payload: { name, frequency } };
}

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
