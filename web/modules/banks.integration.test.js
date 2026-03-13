const test = require("node:test");
const assert = require("node:assert/strict");

const { setupFrontendApp } = require("../integration-test-setup.js");
const { createStores, assertConflict } = require("../test-support/fetch-mock/helpers.js");
const { handleBanksCollection } = require("../test-support/fetch-mock/handlers/handle-banks-collection.js");
const { handleBanksByID } = require("../test-support/fetch-mock/handlers/handle-banks-by-id.js");

test("frontend can create and list a bank", async () => {
  const { dom, window, document } = await setupFrontendApp();

  document.getElementById("bank-name").value = "My Bank";
  document.getElementById("bank-country").value = "US";

  const form = document.getElementById("bank-form");
  form.dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  const message = document.getElementById("bank-form-message").textContent;
  const rowsText = document.getElementById("banks-body").textContent;

  assert.equal(message, "Bank created");
  assert.match(rowsText, /My Bank/);
  assert.match(rowsText, /US/);

  dom.window.close();
});

test("frontend supports bank edit and delete actions", async () => {
  const { dom, window, document } = await setupFrontendApp();

  document.getElementById("bank-name").value = "Edit Bank";
  document.getElementById("bank-country").value = "CA";
  document
    .getElementById("bank-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  const editButton = document.querySelector('#banks-body button[data-action="edit"]');
  editButton.dispatchEvent(new window.Event("click", { bubbles: true }));

  assert.equal(document.getElementById("bank-submit-button").textContent, "Update");
  assert.equal(document.getElementById("bank-cancel-button").hidden, false);
  assert.equal(document.getElementById("bank-name").value, "Edit Bank");

  document.getElementById("bank-name").value = "Edit Bank Updated";
  document.getElementById("bank-country").value = "GB";
  document
    .getElementById("bank-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.match(document.getElementById("banks-body").textContent, /Edit Bank Updated/);
  assert.match(document.getElementById("banks-body").textContent, /GB/);

  const deleteButton = document.querySelector('#banks-body button[data-action="delete"]');
  deleteButton.dispatchEvent(new window.Event("click", { bubbles: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.match(document.getElementById("banks-body").textContent, /No banks yet/);

  dom.window.close();
});

test("frontend shows error message on duplicate bank conflict", async () => {
  const { dom, window, document } = await setupFrontendApp();

  document.getElementById("bank-name").value = "Conflict Bank";
  document.getElementById("bank-country").value = "US";
  document
    .getElementById("bank-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  document.getElementById("bank-name").value = "Conflict Bank";
  document.getElementById("bank-country").value = "US";
  document
    .getElementById("bank-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  const message = document.getElementById("bank-form-message");
  assert.equal(message.textContent, "name and country combination must be unique");
  assert.equal(message.className, "error");

  dom.window.close();
});

test("banks collection conflict path", async () => {
  const stores = createStores();
  stores.banksStore.push({ id: 1, name: "Alpha", country: "US" });

  const response = handleBanksCollection(
    "/api/banks",
    "POST",
    { body: JSON.stringify({ name: "Alpha", country: "US" }) },
    stores
  );

  await assertConflict(response, "duplicate_bank", "name and country combination must be unique");
});

test("banks by-id conflict path", async () => {
  const stores = createStores();
  stores.banksStore.push({ id: 1, name: "Alpha", country: "US" }, { id: 2, name: "Beta", country: "US" });

  const response = handleBanksByID(
    "/api/banks/2",
    "PUT",
    { body: JSON.stringify({ name: "Alpha", country: "US" }) },
    stores
  );

  await assertConflict(response, "duplicate_bank", "name and country combination must be unique");
});
