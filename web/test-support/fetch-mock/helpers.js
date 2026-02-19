const { createResponse } = require("../integration-http.js");

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

module.exports = {
  parseBody,
  cloneItems,
  invalidPayload,
  notFound,
  conflict,
  trimmedValue,
  upperTrimmedValue,
  createStores,
  parseParentID,
};
