const { createResponse, normalize } = require("../../integration-http.js");
const { parseBody, notFound, conflict, invalidPayload, trimmedValue } = require("../helpers.js");

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

function handleExpensesByID(pathname, method, options, stores) {
  const expenseMatch = pathname.match(/^\/api\/expenses\/(\d+)$/);
  if (!expenseMatch) {
    return null;
  }

  if (method === "PUT") {
    const id = Number(expenseMatch[1]);
    const index = stores.expensesStore.findIndex((item) => item.id === id);
    if (index === -1) {
      return notFound("expense not found");
    }

    const parsed = validateExpensePayload(parseBody(options));
    if (parsed.error) {
      return parsed.error;
    }

    const duplicate = stores.expensesStore.some(
      (item) => item.id !== id && normalize(item.name) === normalize(parsed.payload.name)
    );
    if (duplicate) {
      return conflict("duplicate_expense", "expense name must be unique");
    }

    const updated = {
      id,
      name: parsed.payload.name,
      frequency: parsed.payload.frequency,
    };
    stores.expensesStore[index] = updated;
    return createResponse(200, updated);
  }

  if (method === "DELETE") {
    const id = Number(expenseMatch[1]);
    const index = stores.expensesStore.findIndex((item) => item.id === id);
    if (index === -1) {
      return notFound("expense not found");
    }

    stores.expensesStore.splice(index, 1);
    return createResponse(204);
  }

  return null;
}

module.exports = { handleExpensesByID };
