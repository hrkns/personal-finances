const { createResponse } = require("../../integration-http.js");
const { parseBody, cloneItems, invalidPayload } = require("../helpers.js");

function parseDateOnly(value) {
  const date = String(value ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return null;
  }

  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString().slice(0, 10) === date ? date : null;
}

function parseType(value) {
  const type = String(value ?? "").trim().toLowerCase();
  return type === "income" || type === "expense" ? type : null;
}

function parsePositiveFloat(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  return amount;
}

function parsePositiveInteger(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

function parseNotes(value) {
  const notes = String(value ?? "").trim();
  return notes ? notes : null;
}

function validateReferences(stores, personID, bankAccountID, categoryID) {
  const personExists = stores.peopleStore.some((item) => item.id === personID);
  if (!personExists) {
    return "person must exist";
  }

  const bankAccountExists = stores.bankAccountsStore.some((item) => item.id === bankAccountID);
  if (!bankAccountExists) {
    return "bank account must exist";
  }

  const categoryExists = stores.transactionCategoriesStore.some((item) => item.id === categoryID);
  if (!categoryExists) {
    return "transaction category must exist";
  }

  return null;
}

function normalizeTransactionPayload(payload, stores) {
  const transactionDate = parseDateOnly(payload.transaction_date);
  if (!transactionDate) {
    return { error: invalidPayload("transaction_date must be a valid date in YYYY-MM-DD format") };
  }

  const type = parseType(payload.type);
  if (!type) {
    return { error: invalidPayload("type must be either income or expense") };
  }

  const amount = parsePositiveFloat(payload.amount);
  if (!amount) {
    return { error: invalidPayload("amount must be greater than zero") };
  }

  const personID = parsePositiveInteger(payload.person_id);
  if (!personID) {
    return { error: invalidPayload("person_id must be a positive integer") };
  }

  const bankAccountID = parsePositiveInteger(payload.bank_account_id);
  if (!bankAccountID) {
    return { error: invalidPayload("bank_account_id must be a positive integer") };
  }

  const categoryID = parsePositiveInteger(payload.category_id);
  if (!categoryID) {
    return { error: invalidPayload("category_id must be a positive integer") };
  }

  const referenceError = validateReferences(stores, personID, bankAccountID, categoryID);
  if (referenceError) {
    return { error: invalidPayload(referenceError) };
  }

  return {
    value: {
      transaction_date: transactionDate,
      type,
      amount,
      notes: parseNotes(payload.notes),
      person_id: personID,
      bank_account_id: bankAccountID,
      category_id: categoryID,
    },
  };
}

function handleTransactionsCollection(pathname, method, options, stores) {
  if (pathname === "/api/transactions" && method === "GET") {
    return createResponse(200, cloneItems(stores.transactionsStore));
  }

  if (pathname === "/api/transactions" && method === "POST") {
    const payload = parseBody(options);
    const normalized = normalizeTransactionPayload(payload, stores);
    if (normalized.error) {
      return normalized.error;
    }

    const created = {
      id: stores.nextTransactionId,
      ...normalized.value,
    };
    stores.nextTransactionId += 1;
    stores.transactionsStore.push(created);
    return createResponse(201, created);
  }

  return null;
}

module.exports = {
  handleTransactionsCollection,
  normalizeTransactionPayload,
};
