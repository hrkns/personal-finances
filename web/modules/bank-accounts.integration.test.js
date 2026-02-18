const test = require("node:test");
const assert = require("node:assert/strict");

const { setupFrontendApp } = require("../integration-test-setup.js");

test("frontend can create and list a bank account", async () => {
  const { dom, window, document } = await setupFrontendApp();

  document.querySelector('[data-route-tab="bank-accounts"]').click();

  document.getElementById("currency-name").value = "US Dollar";
  document.getElementById("currency-code").value = "usd";
  document
    .getElementById("currency-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  document.getElementById("bank-name").value = "Home Bank";
  document.getElementById("bank-country").value = "US";
  document
    .getElementById("bank-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  document.getElementById("bank-account-bank-id").value = "1";
  document.getElementById("bank-account-currency-id").value = "1";
  document.getElementById("bank-account-number").value = "ACC-123";
  document.getElementById("bank-account-balance").value = "12.34";
  document
    .getElementById("bank-account-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  const message = document.getElementById("bank-account-form-message").textContent;
  const rowsText = document.getElementById("bank-accounts-body").textContent;

  assert.equal(message, "Bank account created");
  assert.match(rowsText, /Home Bank/);
  assert.match(rowsText, /USD/);
  assert.match(rowsText, /ACC-123/);

  dom.window.close();
});

test("frontend supports bank account edit and delete actions", async () => {
  const { dom, window, document } = await setupFrontendApp();

  document.querySelector('[data-route-tab="bank-accounts"]').click();

  document.getElementById("currency-name").value = "US Dollar";
  document.getElementById("currency-code").value = "usd";
  document
    .getElementById("currency-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  document.getElementById("bank-name").value = "Edit Account Bank";
  document.getElementById("bank-country").value = "US";
  document
    .getElementById("bank-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  document.getElementById("bank-account-bank-id").value = "1";
  document.getElementById("bank-account-currency-id").value = "1";
  document.getElementById("bank-account-number").value = "EDIT-1";
  document.getElementById("bank-account-balance").value = "10";
  document
    .getElementById("bank-account-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  const editButton = document.querySelector('#bank-accounts-body button[data-action="edit"]');
  editButton.dispatchEvent(new window.Event("click", { bubbles: true }));

  assert.equal(document.getElementById("bank-account-submit-button").textContent, "Update");

  document.getElementById("bank-account-number").value = "EDIT-2";
  document.getElementById("bank-account-balance").value = "20.55";
  document
    .getElementById("bank-account-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.match(document.getElementById("bank-accounts-body").textContent, /EDIT-2/);

  const deleteButton = document.querySelector('#bank-accounts-body button[data-action="delete"]');
  deleteButton.dispatchEvent(new window.Event("click", { bubbles: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.match(document.getElementById("bank-accounts-body").textContent, /No bank accounts yet/);

  dom.window.close();
});

test("frontend shows error message on duplicate bank account conflict", async () => {
  const { dom, window, document } = await setupFrontendApp();

  document.querySelector('[data-route-tab="bank-accounts"]').click();

  document.getElementById("currency-name").value = "US Dollar";
  document.getElementById("currency-code").value = "usd";
  document
    .getElementById("currency-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  document.getElementById("bank-name").value = "Conflict Account Bank";
  document.getElementById("bank-country").value = "US";
  document
    .getElementById("bank-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  document.getElementById("bank-account-bank-id").value = "1";
  document.getElementById("bank-account-currency-id").value = "1";
  document.getElementById("bank-account-number").value = "DUP-1";
  document.getElementById("bank-account-balance").value = "10";
  document
    .getElementById("bank-account-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  document.getElementById("bank-account-bank-id").value = "1";
  document.getElementById("bank-account-currency-id").value = "1";
  document.getElementById("bank-account-number").value = "DUP-1";
  document.getElementById("bank-account-balance").value = "11";
  document
    .getElementById("bank-account-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  const message = document.getElementById("bank-account-form-message");
  assert.equal(message.textContent, "bank, currency and account number combination must be unique");
  assert.equal(message.className, "error");

  dom.window.close();
});
