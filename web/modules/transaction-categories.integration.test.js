const test = require("node:test");
const assert = require("node:assert/strict");

const { setupFrontendApp } = require("../integration-test-setup.js");
const { createStores, assertConflict } = require("../test-support/fetch-mock/helpers.js");
const { handleTransactionCategoriesCollection } = require("../test-support/fetch-mock/handlers/handle-transaction-categories-collection.js");
const { handleTransactionCategoriesByID } = require("../test-support/fetch-mock/handlers/handle-transaction-categories-by-id.js");

test("frontend can create and list a root transaction category", async () => {
  const { dom, window, document } = await setupFrontendApp();

  document.querySelector('[data-route-tab="settings"]').click();
  document.querySelector('[data-settings-tab="transaction-categories"]').click();
  document.getElementById("transaction-category-name").value = "Salary";

  document
    .getElementById("transaction-category-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  const message = document.getElementById("transaction-category-form-message").textContent;
  const rowsText = document.getElementById("transaction-categories-body").textContent;

  assert.equal(message, "Transaction category created");
  assert.match(rowsText, /Salary/);

  dom.window.close();
});

test("frontend supports parent category, edit and delete actions", async () => {
  const { dom, window, document } = await setupFrontendApp();

  document.querySelector('[data-route-tab="settings"]').click();
  document.querySelector('[data-settings-tab="transaction-categories"]').click();

  document.getElementById("transaction-category-name").value = "Salary";
  document
    .getElementById("transaction-category-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  document.getElementById("transaction-category-name").value = "Job 1";
  document.getElementById("transaction-category-parent-id").value = "1";
  document
    .getElementById("transaction-category-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  const rowsText = document.getElementById("transaction-categories-body").textContent;
  assert.match(rowsText, /Job 1/);
  assert.match(rowsText, /Salary/);

  const editButton = document.querySelector('#transaction-categories-body button[data-action="edit"][data-id="2"]');
  editButton.dispatchEvent(new window.Event("click", { bubbles: true }));

  assert.equal(document.getElementById("transaction-category-submit-button").textContent, "Update");
  assert.equal(document.getElementById("transaction-category-name").value, "Job 1");

  document.getElementById("transaction-category-name").value = "Job One";
  document
    .getElementById("transaction-category-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.match(document.getElementById("transaction-categories-body").textContent, /Job One/);

  const deleteChildButton = document.querySelector(
    '#transaction-categories-body button[data-action="delete"][data-id="2"]'
  );
  deleteChildButton.dispatchEvent(new window.Event("click", { bubbles: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  const deleteParentButton = document.querySelector(
    '#transaction-categories-body button[data-action="delete"][data-id="1"]'
  );
  deleteParentButton.dispatchEvent(new window.Event("click", { bubbles: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.match(document.getElementById("transaction-categories-body").textContent, /No transaction categories yet/);

  dom.window.close();
});

test("frontend shows validation error for blank transaction category name", async () => {
  const { dom, window, document } = await setupFrontendApp();

  document.querySelector('[data-route-tab="settings"]').click();
  document.querySelector('[data-settings-tab="transaction-categories"]').click();
  document.getElementById("transaction-category-name").value = "   ";

  document
    .getElementById("transaction-category-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));

  const message = document.getElementById("transaction-category-form-message");
  assert.equal(message.textContent, "name is required");
  assert.equal(message.className, "error");

  dom.window.close();
});

test("transaction categories collection conflict path", async () => {
  const stores = createStores();
  stores.transactionCategoriesStore.push({ id: 1, name: "Salary", parent_id: null });

  const response = handleTransactionCategoriesCollection(
    "/api/transaction-categories",
    "POST",
    { body: JSON.stringify({ name: "Salary", parent_id: null }) },
    stores
  );

  await assertConflict(response, "duplicate_transaction_category", "category name must be unique under the same parent");
});

test("transaction categories by-id update conflict path", async () => {
  const stores = createStores();
  stores.transactionCategoriesStore.push(
    { id: 1, name: "Salary", parent_id: null },
    { id: 2, name: "Bonus", parent_id: null }
  );

  const response = handleTransactionCategoriesByID(
    "/api/transaction-categories/2",
    "PUT",
    { body: JSON.stringify({ name: "Salary", parent_id: null }) },
    stores
  );

  await assertConflict(response, "duplicate_transaction_category", "category name must be unique under the same parent");
});

test("transaction categories by-id delete in-use conflict path", async () => {
  const stores = createStores();
  stores.transactionCategoriesStore.push(
    { id: 1, name: "Salary", parent_id: null },
    { id: 2, name: "Monthly Salary", parent_id: 1 }
  );

  const response = handleTransactionCategoriesByID(
    "/api/transaction-categories/1",
    "DELETE",
    {},
    stores
  );

  await assertConflict(response, "category_in_use", "transaction category is in use");
});
