const { createResponse, normalize } = require("../../integration-http.js");
const { parseBody, invalidPayload, notFound, conflict, trimmedValue, parseParentID } = require("../helpers.js");

function buildCategoryOutput(category, categoriesStore) {
  const parent = category.parent_id ? categoriesStore.find((item) => item.id === category.parent_id) : null;
  return {
    ...category,
    parent_name: parent ? parent.name : null,
  };
}

function hasDuplicateCategory(categoriesStore, id, name, parentID) {
  return categoriesStore.some(
    (item) => item.id !== id && normalize(item.name) === normalize(name) && item.parent_id === parentID
  );
}

function handleTransactionCategoriesByID(pathname, method, options, stores) {
  const match = pathname.match(/^\/api\/transaction-categories\/(\d+)$/);
  if (!match) {
    return null;
  }

  const id = Number(match[1]);
  const index = stores.transactionCategoriesStore.findIndex((item) => item.id === id);

  if (method === "PUT") {
    if (index === -1) {
      return notFound("transaction category not found");
    }

    const payload = parseBody(options);
    const name = trimmedValue(payload.name);
    if (!name) {
      return invalidPayload("name is required");
    }

    const parentID = parseParentID(payload.parent_id);
    if (Number.isNaN(parentID)) {
      return invalidPayload("parent_id must be a positive integer");
    }

    if (parentID !== null && parentID === id) {
      return invalidPayload("category cannot be its own parent");
    }

    if (parentID !== null && !stores.transactionCategoriesStore.some((item) => item.id === parentID)) {
      return invalidPayload("parent category must exist");
    }

    if (hasDuplicateCategory(stores.transactionCategoriesStore, id, name, parentID)) {
      return conflict("duplicate_transaction_category", "category name must be unique under the same parent");
    }

    const updated = {
      id,
      name,
      parent_id: parentID,
    };
    stores.transactionCategoriesStore[index] = updated;

    return createResponse(200, buildCategoryOutput(updated, stores.transactionCategoriesStore));
  }

  if (method === "DELETE") {
    if (index === -1) {
      return notFound("transaction category not found");
    }

    const hasChildren = stores.transactionCategoriesStore.some((item) => item.parent_id === id);
    if (hasChildren) {
      return conflict("category_in_use", "transaction category is in use");
    }

    stores.transactionCategoriesStore.splice(index, 1);
    return createResponse(204);
  }

  if (method === "GET") {
    if (index === -1) {
      return notFound("transaction category not found");
    }

    return createResponse(
      200,
      buildCategoryOutput(stores.transactionCategoriesStore[index], stores.transactionCategoriesStore)
    );
  }

  return null;
}

module.exports = { handleTransactionCategoriesByID };
