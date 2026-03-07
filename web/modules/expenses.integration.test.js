const test = require("node:test");
const assert = require("node:assert/strict");

const { setupFrontendApp } = require("../integration-test-setup.js");
const { createStores, assertConflict } = require("../test-support/fetch-mock/helpers.js");
const { handleExpensesCollection } = require("../test-support/fetch-mock/handlers/handle-expenses-collection.js");
const { handleExpensesByID } = require("../test-support/fetch-mock/handlers/handle-expenses-by-id.js");

test("frontend can create and list an expense", async () => {
  const { dom, window, document } = await setupFrontendApp();

  document.querySelector('[data-route-tab="expenses"]').click();
  document.querySelector('[data-expense-tab="expenses"]').click();
  document.getElementById("expense-name").value = "Rent";
  document.getElementById("expense-frequency").value = "monthly";

  document
    .getElementById("expense-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  const message = document.getElementById("expense-form-message").textContent;
  const rowsText = document.getElementById("expenses-body").textContent;

  assert.equal(message, "Expense created");
  assert.match(rowsText, /Rent/);
  assert.match(rowsText, /monthly/);

  dom.window.close();
});

test("frontend supports expense edit and delete actions", async () => {
  const { dom, window, document } = await setupFrontendApp();

  document.querySelector('[data-route-tab="expenses"]').click();
  document.querySelector('[data-expense-tab="expenses"]').click();

  document.getElementById("expense-name").value = "Gym";
  document.getElementById("expense-frequency").value = "weekly";
  document
    .getElementById("expense-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  const editButton = document.querySelector('#expenses-body button[data-action="edit"][data-id="1"]');
  editButton.dispatchEvent(new window.Event("click", { bubbles: true }));

  assert.equal(document.getElementById("expense-submit-button").textContent, "Update");
  assert.equal(document.getElementById("expense-name").value, "Gym");

  document.getElementById("expense-name").value = "Gym Premium";
  document.getElementById("expense-frequency").value = "monthly";
  document
    .getElementById("expense-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.match(document.getElementById("expenses-body").textContent, /Gym Premium/);
  assert.match(document.getElementById("expenses-body").textContent, /monthly/);

  const deleteButton = document.querySelector('#expenses-body button[data-action="delete"][data-id="1"]');
  deleteButton.dispatchEvent(new window.Event("click", { bubbles: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.match(document.getElementById("expenses-body").textContent, /No expenses yet/);

  dom.window.close();
});

test("frontend shows validation error for invalid expense frequency", async () => {
  const { dom, window, document } = await setupFrontendApp();

  document.querySelector('[data-route-tab="expenses"]').click();
  document.querySelector('[data-expense-tab="expenses"]').click();

  document.getElementById("expense-name").value = "Streaming";
  document.getElementById("expense-frequency").value = "";
  document
    .getElementById("expense-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));

  const message = document.getElementById("expense-form-message");
  assert.equal(message.textContent, "frequency is required");
  assert.equal(message.className, "error");

  dom.window.close();
});

test("expenses collection conflict path", async () => {
  const stores = createStores();
  stores.expensesStore.push({ id: 1, name: "Rent", frequency: "monthly" });

  const response = handleExpensesCollection(
    "/api/expenses",
    "POST",
    { body: JSON.stringify({ name: "rent", frequency: "monthly" }) },
    stores
  );

  await assertConflict(response, "duplicate_expense", "expense name must be unique");
});

test("expenses by-id conflict path", async () => {
  const stores = createStores();
  stores.expensesStore.push(
    { id: 1, name: "Rent", frequency: "monthly" },
    { id: 2, name: "Gym", frequency: "weekly" }
  );

  const response = handleExpensesByID(
    "/api/expenses/2",
    "PUT",
    { body: JSON.stringify({ name: "Rent", frequency: "weekly" }) },
    stores
  );

  await assertConflict(response, "duplicate_expense", "expense name must be unique");
});
