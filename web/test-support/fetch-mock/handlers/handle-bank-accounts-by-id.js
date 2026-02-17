const { createResponse } = require("../../integration-http.js");
const { parseBody, notFound, conflict, trimmedValue } = require("../helpers.js");

function handleBankAccountsByID(pathname, method, options, stores) {
  const bankAccountMatch = pathname.match(/^\/api\/bank-accounts\/(\d+)$/);
  if (!bankAccountMatch) {
    return null;
  }

  if (method === "PUT") {
    const id = Number(bankAccountMatch[1]);
    const payload = parseBody(options);
    const index = stores.bankAccountsStore.findIndex((item) => item.id === id);
    if (index === -1) {
      return notFound("bank account not found");
    }

    const duplicate = stores.bankAccountsStore.some(
      (item) =>
        item.id !== id &&
        item.bank_id === Number(payload.bank_id) &&
        item.currency_id === Number(payload.currency_id) &&
        item.account_number === trimmedValue(payload.account_number)
    );
    if (duplicate) {
      return conflict("duplicate_bank_account", "bank, currency and account number combination must be unique");
    }

    const updated = {
      id,
      bank_id: Number(payload.bank_id),
      currency_id: Number(payload.currency_id),
      account_number: trimmedValue(payload.account_number),
      balance: Number(payload.balance),
    };
    stores.bankAccountsStore[index] = updated;
    return createResponse(200, updated);
  }

  if (method === "DELETE") {
    const id = Number(bankAccountMatch[1]);
    const index = stores.bankAccountsStore.findIndex((item) => item.id === id);
    if (index === -1) {
      return notFound("bank account not found");
    }

    stores.bankAccountsStore.splice(index, 1);
    return createResponse(204);
  }

  return null;
}

module.exports = { handleBankAccountsByID };
