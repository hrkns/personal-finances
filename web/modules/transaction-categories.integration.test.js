const test = require("node:test");
const assert = require("node:assert/strict");

const { setupFrontendApp } = require("../integration-test-setup.js");

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
