const { createResponse, normalize } = require("../../integration-http.js");
const { parseBody, cloneItems, invalidPayload, conflict, trimmedValue } = require("../helpers.js");

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

function parentExists(store, parentID) {
  return store.some((item) => item.id === parentID);
}

function buildCategoryOutput(category, categoriesStore) {
  const parent = category.parent_id ? categoriesStore.find((item) => item.id === category.parent_id) : null;
  return {
    ...category,
    parent_name: parent ? parent.name : null,
  };
}

function hasDuplicateCategory(categoriesStore, name, parentID) {
  return categoriesStore.some((item) => normalize(item.name) === normalize(name) && item.parent_id === parentID);
}

function handleTransactionCategoriesCollection(pathname, method, options, stores) {
  if (pathname === "/api/transaction-categories" && method === "GET") {
    const output = stores.transactionCategoriesStore.map((item) => buildCategoryOutput(item, stores.transactionCategoriesStore));
    return createResponse(200, cloneItems(output));
  }

  if (pathname === "/api/transaction-categories" && method === "POST") {
    const payload = parseBody(options);
    const name = trimmedValue(payload.name);
    if (!name) {
      return invalidPayload("name is required");
    }

    const parentID = parseParentID(payload.parent_id);
    if (Number.isNaN(parentID)) {
      return invalidPayload("parent_id must be a positive integer");
    }

    if (parentID !== null && !parentExists(stores.transactionCategoriesStore, parentID)) {
      return invalidPayload("parent category must exist");
    }

    if (hasDuplicateCategory(stores.transactionCategoriesStore, name, parentID)) {
      return conflict("duplicate_transaction_category", "category name must be unique under the same parent");
    }

    const created = {
      id: stores.nextTransactionCategoryID,
      name,
      parent_id: parentID,
    };
    stores.nextTransactionCategoryID += 1;
    stores.transactionCategoriesStore.push(created);

    return createResponse(201, buildCategoryOutput(created, stores.transactionCategoriesStore));
  }

  return null;
}

module.exports = { handleTransactionCategoriesCollection };
