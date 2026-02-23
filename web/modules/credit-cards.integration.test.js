const test = require("node:test");
const assert = require("node:assert/strict");

const { setupFrontendApp } = require("../integration-test-setup.js");

async function createBankAndPerson(window, document) {
  document.getElementById("bank-name").value = "Credit Card Bank";
  document.getElementById("bank-country").value = "US";
  document
    .getElementById("bank-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  document.getElementById("person-name").value = "Credit Card Person";
  document
    .getElementById("people-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
}

async function createCurrencies(window, document) {
  document.getElementById("currency-name").value = "US Dollar";
  document.getElementById("currency-code").value = "usd";
  document
    .getElementById("currency-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  document.getElementById("currency-name").value = "Euro";
  document.getElementById("currency-code").value = "eur";
  document
    .getElementById("currency-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
}

test("frontend can create and list a credit card", async () => {
  const { dom, window, document } = await setupFrontendApp();

  document.querySelector('[data-route-tab="credit-cards"]').click();

  await createBankAndPerson(window, document);
  await createCurrencies(window, document);

  document.getElementById("credit-card-bank-id").value = "1";
  document.getElementById("credit-card-person-id").value = "1";
  document.getElementById("credit-card-number").value = "4111";
  document.getElementById("credit-card-name").value = "Main Card";
  const currenciesSelect = document.getElementById("credit-card-currency-ids");
  for (const option of currenciesSelect.options) {
    option.selected = option.value === "1";
  }
  document
    .getElementById("credit-card-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  const message = document.getElementById("credit-card-form-message").textContent;
  const rowsText = document.getElementById("credit-cards-body").textContent;

  assert.equal(message, "Credit card created");
  assert.match(rowsText, /Credit Card Bank/);
  assert.match(rowsText, /Credit Card Person/);
  assert.match(rowsText, /4111/);
  assert.match(rowsText, /Main Card/);
  assert.match(rowsText, /USD/);

  dom.window.close();
});

test("frontend supports credit card edit and delete actions", async () => {
  const { dom, window, document } = await setupFrontendApp();

  document.querySelector('[data-route-tab="credit-cards"]').click();

  await createBankAndPerson(window, document);
  await createCurrencies(window, document);

  document.getElementById("credit-card-bank-id").value = "1";
  document.getElementById("credit-card-person-id").value = "1";
  document.getElementById("credit-card-number").value = "1000";
  document.getElementById("credit-card-name").value = "  ";
  for (const option of document.getElementById("credit-card-currency-ids").options) {
    option.selected = option.value === "1";
  }
  document
    .getElementById("credit-card-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  const editButton = document.querySelector('#credit-cards-body button[data-action="edit"]');
  editButton.dispatchEvent(new window.Event("click", { bubbles: true }));

  assert.equal(document.getElementById("credit-card-submit-button").textContent, "Update");

  document.getElementById("credit-card-number").value = "2000";
  document.getElementById("credit-card-name").value = "Updated Card";
  for (const option of document.getElementById("credit-card-currency-ids").options) {
    option.selected = option.value === "2";
  }
  document
    .getElementById("credit-card-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.match(document.getElementById("credit-cards-body").textContent, /2000/);
  assert.match(document.getElementById("credit-cards-body").textContent, /Updated Card/);
  assert.match(document.getElementById("credit-cards-body").textContent, /EUR/);

  const deleteButton = document.querySelector('#credit-cards-body button[data-action="delete"]');
  deleteButton.dispatchEvent(new window.Event("click", { bubbles: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.match(document.getElementById("credit-cards-body").textContent, /No credit cards yet/);

  dom.window.close();
});

test("frontend shows error message on duplicate credit card number", async () => {
  const { dom, window, document } = await setupFrontendApp();

  document.querySelector('[data-route-tab="credit-cards"]').click();

  await createBankAndPerson(window, document);

  document.getElementById("credit-card-bank-id").value = "1";
  document.getElementById("credit-card-person-id").value = "1";
  document.getElementById("credit-card-number").value = "DUP-1";
  document.getElementById("credit-card-name").value = "First";
  document
    .getElementById("credit-card-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  document.getElementById("credit-card-bank-id").value = "1";
  document.getElementById("credit-card-person-id").value = "1";
  document.getElementById("credit-card-number").value = "DUP-1";
  document.getElementById("credit-card-name").value = "Second";
  document
    .getElementById("credit-card-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  const message = document.getElementById("credit-card-form-message");
  assert.equal(message.textContent, "credit card number must be unique");
  assert.equal(message.className, "error");

  dom.window.close();
});

test("frontend can manage currencies for a credit card inline", async () => {
  const { dom, window, document } = await setupFrontendApp();

  document.querySelector('[data-route-tab="credit-cards"]').click();

  await createBankAndPerson(window, document);
  await createCurrencies(window, document);

  document.getElementById("credit-card-bank-id").value = "1";
  document.getElementById("credit-card-person-id").value = "1";
  document.getElementById("credit-card-number").value = "CUR-1";
  document.getElementById("credit-card-name").value = "Currency Card";
  document
    .getElementById("credit-card-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  const manageButton = document.querySelector('#credit-cards-body button[data-action="manage-currencies"]');
  manageButton.dispatchEvent(new window.Event("click", { bubbles: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));

  const select = document.querySelector('select[data-role="currency-select"][data-credit-card-id="1"]');
  for (const option of select.options) {
    option.selected = option.value === "1" || option.value === "2";
  }

  const saveButton = document.querySelector('#credit-cards-body button[data-action="save-currencies"][data-id="1"]');
  saveButton.dispatchEvent(new window.Event("click", { bubbles: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  const message = document.getElementById("credit-card-form-message");
  const rowsText = document.getElementById("credit-cards-body").textContent;

  assert.equal(message.textContent, "Credit card currencies updated");
  assert.match(rowsText, /USD/);
  assert.match(rowsText, /EUR/);

  dom.window.close();
});
