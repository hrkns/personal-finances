const { createResponse } = require("../../integration-http.js");
const { parseBody, notFound } = require("../helpers.js");
const { normalizeTransactionPayload } = require("./handle-transactions-collection.js");

function handleTransactionsByID(pathname, method, options, stores) {
  const match = pathname.match(/^\/api\/transactions\/(\d+)$/);
  if (!match) {
    return null;
  }

  const id = Number(match[1]);
  const index = stores.transactionsStore.findIndex((item) => item.id === id);

  if (method === "GET") {
    if (index === -1) {
      return notFound("transaction not found");
    }

    return createResponse(200, { ...stores.transactionsStore[index] });
  }

  if (method === "PUT") {
    if (index === -1) {
      return notFound("transaction not found");
    }

    const payload = parseBody(options);
    const normalized = normalizeTransactionPayload(payload, stores);
    if (normalized.error) {
      return normalized.error;
    }

    const updated = {
      id,
      ...normalized.value,
    };
    stores.transactionsStore[index] = updated;
    return createResponse(200, updated);
  }

  if (method === "DELETE") {
    if (index === -1) {
      return notFound("transaction not found");
    }

    stores.transactionsStore.splice(index, 1);
    return createResponse(204);
  }

  return null;
}

module.exports = { handleTransactionsByID };
