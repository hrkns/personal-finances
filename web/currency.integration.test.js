const test = require("node:test");
const assert = require("node:assert/strict");

const { setupFrontendApp } = require("./integration-test-setup.js");

test("frontend can create and list a currency", async () => {
  const { dom, window, document } = await setupFrontendApp();

  document.getElementById("currency-name").value = "US Dollar";
  document.getElementById("currency-code").value = "usd";

  const form = document.getElementById("currency-form");
  form.dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  const message = document.getElementById("form-message").textContent;
  const rowsText = document.getElementById("currencies-body").textContent;

  assert.equal(message, "Currency created");
  assert.match(rowsText, /US Dollar/);
  assert.match(rowsText, /USD/);

  dom.window.close();
});

test("frontend supports edit and delete actions", async () => {
  const { dom, window, document } = await setupFrontendApp();

  document.getElementById("currency-name").value = "Euro";
  document.getElementById("currency-code").value = "eur";
  document
    .getElementById("currency-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  const editButton = document.querySelector('button[data-action="edit"]');
  editButton.dispatchEvent(new window.Event("click", { bubbles: true }));

  assert.equal(document.getElementById("submit-button").textContent, "Update");
  assert.equal(document.getElementById("currency-name").value, "Euro");

  document.getElementById("currency-name").value = "Euro Updated";
  document.getElementById("currency-code").value = "eux";
  document
    .getElementById("currency-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.match(document.getElementById("currencies-body").textContent, /Euro Updated/);

  const deleteButton = document.querySelector('button[data-action="delete"]');
  deleteButton.dispatchEvent(new window.Event("click", { bubbles: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.match(document.getElementById("currencies-body").textContent, /No currencies yet/);

  dom.window.close();
});

test("frontend shows error message on duplicate currency conflict", async () => {
  const { dom, window, document } = await setupFrontendApp();

  document.getElementById("currency-name").value = "Euro";
  document.getElementById("currency-code").value = "eur";
  document
    .getElementById("currency-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  document.getElementById("currency-name").value = "Euro";
  document.getElementById("currency-code").value = "eur";
  document
    .getElementById("currency-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  const message = document.getElementById("form-message");
  assert.equal(message.textContent, "name and code must be unique");
  assert.equal(message.className, "error");

  dom.window.close();
});
