const test = require("node:test");
const assert = require("node:assert/strict");

const { setupFrontendApp } = require("../integration-test-setup.js");

test("frontend can create and list a person", async () => {
  const { dom, window, document } = await setupFrontendApp();

  document.querySelector('[data-route-tab="settings"]').click();
  document.querySelector('[data-settings-tab="people"]').click();
  document.getElementById("person-name").value = "John Doe";

  const form = document.getElementById("people-form");
  form.dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  const message = document.getElementById("person-form-message").textContent;
  const rowsText = document.getElementById("people-body").textContent;

  assert.equal(message, "Person created");
  assert.match(rowsText, /John Doe/);

  dom.window.close();
});

test("frontend supports person edit and delete actions", async () => {
  const { dom, window, document } = await setupFrontendApp();

  document.querySelector('[data-route-tab="settings"]').click();
  document.querySelector('[data-settings-tab="people"]').click();
  document.getElementById("person-name").value = "Jane Doe";
  document
    .getElementById("people-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  const editButton = document.querySelector('#people-body button[data-action="edit"]');
  editButton.dispatchEvent(new window.Event("click", { bubbles: true }));

  assert.equal(document.getElementById("person-submit-button").textContent, "Update");
  assert.equal(document.getElementById("person-name").value, "Jane Doe");

  document.getElementById("person-name").value = "Jane Updated";
  document
    .getElementById("people-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.match(document.getElementById("people-body").textContent, /Jane Updated/);

  const deleteButton = document.querySelector('#people-body button[data-action="delete"]');
  deleteButton.dispatchEvent(new window.Event("click", { bubbles: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.match(document.getElementById("people-body").textContent, /No people yet/);

  dom.window.close();
});

test("frontend shows validation error for blank person name", async () => {
  const { dom, window, document } = await setupFrontendApp();

  document.querySelector('[data-route-tab="settings"]').click();
  document.querySelector('[data-settings-tab="people"]').click();
  document.getElementById("person-name").value = "   ";
  document
    .getElementById("people-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));

  const message = document.getElementById("person-form-message");
  assert.equal(message.textContent, "name is required");
  assert.equal(message.className, "error");

  dom.window.close();
});
