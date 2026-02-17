const { createResponse } = require("../../integration-http.js");
const { parseBody, cloneItems, conflict, trimmedValue } = require("../helpers.js");

function handleBankAccountsCollection(pathname, method, options, stores) {
  if (pathname === "/api/bank-accounts" && method === "GET") {
    return createResponse(200, cloneItems(stores.bankAccountsStore));
  }

  if (pathname === "/api/bank-accounts" && method === "POST") {
    const payload = parseBody(options);
    const duplicate = stores.bankAccountsStore.some(
      (item) =>
        item.bank_id === payload.bank_id &&
        item.currency_id === payload.currency_id &&
        item.account_number === payload.account_number
    );
    if (duplicate) {
      return conflict("duplicate_bank_account", "bank, currency and account number combination must be unique");
    }

    const created = {
      id: stores.nextBankAccountId,
      bank_id: Number(payload.bank_id),
      currency_id: Number(payload.currency_id),
      account_number: trimmedValue(payload.account_number),
      balance: Number(payload.balance),
    };
    stores.nextBankAccountId += 1;
    stores.bankAccountsStore.push(created);
    return createResponse(201, created);
  }

  return null;
}

module.exports = { handleBankAccountsCollection };
