const test = require("node:test");
const assert = require("node:assert/strict");

const { setupFrontendApp } = require("../integration-test-setup.js");

async function createBankPersonAndCreditCard(window, document) {
  document.getElementById("bank-name").value = "Cycle Bank";
  document.getElementById("bank-country").value = "US";
  document
    .getElementById("bank-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  document.getElementById("person-name").value = "Cycle Person";
  document
    .getElementById("people-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  document.getElementById("credit-card-bank-id").value = "1";
  document.getElementById("credit-card-person-id").value = "1";
  document.getElementById("credit-card-number").value = "41112222";
  document.getElementById("credit-card-name").value = "Cycle Card";
  document
    .getElementById("credit-card-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
}

test("frontend can create and list a credit card cycle", async () => {
  const { dom, window, document } = await setupFrontendApp();

  document.querySelector('[data-route-tab="credit-cards"]').click();
  await createBankPersonAndCreditCard(window, document);

  document.querySelector('[data-credit-card-tab="cycles"]').click();

  document.getElementById("credit-card-cycle-credit-card-id").value = "1";
  document.getElementById("credit-card-cycle-closing-date").value = "2026-03-20";
  document.getElementById("credit-card-cycle-due-date").value = "2026-03-30";
  document
    .getElementById("credit-card-cycle-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  const message = document.getElementById("credit-card-cycle-form-message").textContent;
  const rowsText = document.getElementById("credit-card-cycles-body").textContent;

  assert.equal(message, "Credit card cycle created");
  assert.match(rowsText, /41112222/);
  assert.match(rowsText, /2026-03-20/);
  assert.match(rowsText, /2026-03-30/);

  dom.window.close();
});

test("frontend supports credit card cycle edit and delete actions", async () => {
  const { dom, window, document } = await setupFrontendApp();

  document.querySelector('[data-route-tab="credit-cards"]').click();
  await createBankPersonAndCreditCard(window, document);

  document.querySelector('[data-credit-card-tab="cycles"]').click();

  document.getElementById("credit-card-cycle-credit-card-id").value = "1";
  document.getElementById("credit-card-cycle-closing-date").value = "2026-04-01";
  document.getElementById("credit-card-cycle-due-date").value = "2026-04-10";
  document
    .getElementById("credit-card-cycle-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  const editButton = document.querySelector('#credit-card-cycles-body button[data-action="edit"]');
  editButton.dispatchEvent(new window.Event("click", { bubbles: true }));

  assert.equal(document.getElementById("credit-card-cycle-submit-button").textContent, "Update");

  document.getElementById("credit-card-cycle-closing-date").value = "2026-05-01";
  document.getElementById("credit-card-cycle-due-date").value = "2026-05-10";
  document
    .getElementById("credit-card-cycle-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.match(document.getElementById("credit-card-cycles-body").textContent, /2026-05-01/);
  assert.match(document.getElementById("credit-card-cycles-body").textContent, /2026-05-10/);

  const deleteButton = document.querySelector('#credit-card-cycles-body button[data-action="delete"]');
  deleteButton.dispatchEvent(new window.Event("click", { bubbles: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.match(document.getElementById("credit-card-cycles-body").textContent, /No credit card cycles yet/);

  dom.window.close();
});

test("frontend shows error message on duplicate credit card cycle", async () => {
  const { dom, window, document } = await setupFrontendApp();

  document.querySelector('[data-route-tab="credit-cards"]').click();
  await createBankPersonAndCreditCard(window, document);

  document.querySelector('[data-credit-card-tab="cycles"]').click();

  document.getElementById("credit-card-cycle-credit-card-id").value = "1";
  document.getElementById("credit-card-cycle-closing-date").value = "2026-06-15";
  document.getElementById("credit-card-cycle-due-date").value = "2026-06-25";
  document
    .getElementById("credit-card-cycle-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  document.getElementById("credit-card-cycle-credit-card-id").value = "1";
  document.getElementById("credit-card-cycle-closing-date").value = "2026-06-15";
  document.getElementById("credit-card-cycle-due-date").value = "2026-06-25";
  document
    .getElementById("credit-card-cycle-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  const message = document.getElementById("credit-card-cycle-form-message");
  assert.equal(message.textContent, "credit card cycle already exists");
  assert.equal(message.className, "error");

  dom.window.close();
});

test("frontend validates due date is on or after closing date", async () => {
  const { dom, window, document } = await setupFrontendApp();

  document.querySelector('[data-route-tab="credit-cards"]').click();
  await createBankPersonAndCreditCard(window, document);

  document.querySelector('[data-credit-card-tab="cycles"]').click();

  document.getElementById("credit-card-cycle-credit-card-id").value = "1";
  document.getElementById("credit-card-cycle-closing-date").value = "2026-07-20";
  document.getElementById("credit-card-cycle-due-date").value = "2026-07-10";
  document
    .getElementById("credit-card-cycle-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));

  const message = document.getElementById("credit-card-cycle-form-message");
  const rowsText = document.getElementById("credit-card-cycles-body").textContent;

  assert.equal(message.textContent, "due_date must be on or after closing_date");
  assert.equal(message.className, "error");
  assert.match(rowsText, /No credit card cycles yet/);

  dom.window.close();
});

test("frontend can manage cycle balances under a selected cycle", async () => {
  const { dom, window, document } = await setupFrontendApp();

  document.querySelector('[data-route-tab="settings"]').click();
  document.querySelector('[data-settings-tab="currency"]').click();
  document.getElementById("currency-name").value = "US Dollar";
  document.getElementById("currency-code").value = "USD";
  document
    .getElementById("currency-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  document.querySelector('[data-route-tab="credit-cards"]').click();
  await createBankPersonAndCreditCard(window, document);

  document.querySelector('[data-credit-card-tab="cycles"]').click();

  document.getElementById("credit-card-cycle-credit-card-id").value = "1";
  document.getElementById("credit-card-cycle-closing-date").value = "2026-09-01";
  document.getElementById("credit-card-cycle-due-date").value = "2026-09-10";
  document
    .getElementById("credit-card-cycle-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  const balancesButton = document.querySelector('#credit-card-cycles-body button[data-action="balances"]');
  balancesButton.dispatchEvent(new window.Event("click", { bubbles: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  document.getElementById("credit-card-cycle-balance-currency-id").value = "1";
  document.getElementById("credit-card-cycle-balance-balance").value = "500.5";
  document.getElementById("credit-card-cycle-balance-paid").checked = false;
  document
    .getElementById("credit-card-cycle-balance-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.equal(document.getElementById("credit-card-cycle-balance-form-message").textContent, "Credit card cycle balance created");
  assert.match(document.getElementById("credit-card-cycle-balances-body").textContent, /USD/);
  assert.match(document.getElementById("credit-card-cycle-balances-body").textContent, /500.5/);

  const balanceEditButton = document.querySelector('#credit-card-cycle-balances-body button[data-balance-action="edit"]');
  balanceEditButton.dispatchEvent(new window.Event("click", { bubbles: true }));

  document.getElementById("credit-card-cycle-balance-balance").value = "350.25";
  document.getElementById("credit-card-cycle-balance-paid").checked = true;
  document
    .getElementById("credit-card-cycle-balance-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.equal(document.getElementById("credit-card-cycle-balance-form-message").textContent, "Credit card cycle balance updated");
  assert.match(document.getElementById("credit-card-cycle-balances-body").textContent, /350.25/);
  assert.match(document.getElementById("credit-card-cycle-balances-body").textContent, /Yes/);

  const balanceDeleteButton = document.querySelector('#credit-card-cycle-balances-body button[data-balance-action="delete"]');
  balanceDeleteButton.dispatchEvent(new window.Event("click", { bubbles: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.equal(document.getElementById("credit-card-cycle-balance-form-message").textContent, "Credit card cycle balance deleted");
  assert.match(document.getElementById("credit-card-cycle-balances-body").textContent, /No cycle balances yet/);

  dom.window.close();
});
