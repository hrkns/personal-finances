const assert = require("node:assert/strict");
const { createResponse } = require("../integration-http.js");
const { isValidISODate } = require("../../utils.js");

function parseBody(options) {
  return JSON.parse(options.body || "{}");
}

function cloneItems(items) {
  return items.map((item) => ({ ...item }));
}

function invalidPayload(message) {
  return createResponse(400, {
    error: {
      code: "invalid_payload",
      message,
    },
  });
}

function notFound(message) {
  return createResponse(404, {
    error: {
      code: "not_found",
      message,
    },
  });
}

function conflict(code, message) {
  return createResponse(409, {
    error: {
      code,
      message,
    },
  });
}

function trimmedValue(value) {
  return String(value ?? "").trim();
}

function upperTrimmedValue(value) {
  return trimmedValue(value).toUpperCase();
}

function normalizeNullableName(value) {
  const trimmedName = trimmedValue(value);
  return trimmedName ? trimmedName : null;
}

function createStores() {
  return {
    nextTransactionCategoryID: 1,
    transactionCategoriesStore: [],
    nextCurrencyId: 1,
    currenciesStore: [],
    nextPersonId: 1,
    peopleStore: [],
    nextBankId: 1,
    banksStore: [],
    nextBankAccountId: 1,
    bankAccountsStore: [],
    nextCreditCardId: 1,
    creditCardsStore: [],
    nextCreditCardInstallmentId: 1,
    creditCardInstallmentsStore: [],
    nextCreditCardSubscriptionId: 1,
    creditCardSubscriptionsStore: [],
    nextCreditCardCycleId: 1,
    creditCardCyclesStore: [],
    nextCreditCardCycleBalanceId: 1,
    creditCardCycleBalancesStore: [],
    nextCreditCardCurrencyId: 1,
    creditCardCurrenciesStore: [],
    nextExpenseId: 1,
    expensesStore: [],
    nextExpensePaymentId: 1,
    expensePaymentsStore: [],
    nextTransactionId: 1,
    transactionsStore: [],
    countriesStore: [
      { code: "CA", name: "Canada" },
      { code: "GB", name: "United Kingdom" },
      { code: "US", name: "United States" },
    ],
  };
}

function parseParentID(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return NaN;
  }

  return parsed;
}

function validateExpensePayload(payload) {
  const validFrequencies = new Set(["daily", "weekly", "monthly", "annually"]);

  const normalizeFrequency = (value) => String(value ?? "").trim().toLowerCase();

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

function validateExpensePaymentPayload(payload, stores) {
  const expenseID = Number(payload.expense_id);
  const amount = Number(payload.amount);
  const currencyID = Number(payload.currency_id);
  const date = trimmedValue(payload.date);

  if (!Number.isInteger(expenseID) || expenseID <= 0) {
    return { error: invalidPayload("expense_id must be a positive integer") };
  }
  if (!(amount > 0)) {
    return { error: invalidPayload("amount must be greater than zero") };
  }
  if (!Number.isInteger(currencyID) || currencyID <= 0) {
    return { error: invalidPayload("currency_id must be a positive integer") };
  }
  if (!isValidISODate(date)) {
    return { error: invalidPayload("date must be a valid date in YYYY-MM-DD format") };
  }

  const expense = stores.expensesStore.find((item) => item.id === expenseID);
  const currency = stores.currenciesStore.find((item) => item.id === currencyID);
  if (!expense || !currency) {
    return { error: invalidPayload("expense and currency must exist") };
  }

  return {
    payload: {
      expense_id: expenseID,
      amount,
      currency_id: currencyID,
      date,
      expense_frequency: expense.frequency,
    },
  };
}

function buildExpenseFrequencyPeriodKey(date, frequency) {
  const [year, month, day] = date.split("-").map((part) => Number(part));
  if (frequency === "daily") {
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  const base = new Date(Date.UTC(0, month - 1, day));
  base.setUTCFullYear(year);

  if (frequency === "weekly") {
    const dayOfWeek = base.getUTCDay() || 7;
    base.setUTCDate(base.getUTCDate() + 4 - dayOfWeek);
    const weekYear = base.getUTCFullYear();
    const yearStart = new Date(Date.UTC(0, 0, 1));
    yearStart.setUTCFullYear(weekYear);
    const week = Math.ceil((((base - yearStart) / 86400000) + 1) / 7);
    return `${weekYear}-W${String(week).padStart(2, "0")}`;
  }

  if (frequency === "monthly") {
    return `${year}-${String(month).padStart(2, "0")}`;
  }

  return String(year);
}

function hasExpensePaymentInSamePeriod(stores, payload, excludeID) {
  const periodKey = buildExpenseFrequencyPeriodKey(payload.date, payload.expense_frequency);
  return stores.expensePaymentsStore.some((item) => {
    if (excludeID && item.id === excludeID) {
      return false;
    }
    if (item.expense_id !== payload.expense_id) {
      return false;
    }

    return buildExpenseFrequencyPeriodKey(item.date, payload.expense_frequency) === periodKey;
  });
}

async function readJSON(response) {
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function assertConflict(response, code, message) {
  assert.ok(response, "expected handler response");
  assert.equal(response.status, 409);

  const body = await readJSON(response);
  assert.equal(body.error.code, code);
  assert.equal(body.error.message, message);
}

module.exports = {
  parseBody,
  cloneItems,
  invalidPayload,
  notFound,
  conflict,
  trimmedValue,
  upperTrimmedValue,
  normalizeNullableName,
  createStores,
  parseParentID,
  isValidISODate,
  validateExpensePayload,
  validateExpensePaymentPayload,
  buildExpenseFrequencyPeriodKey,
  hasExpensePaymentInSamePeriod,
  readJSON,
  assertConflict,
};
