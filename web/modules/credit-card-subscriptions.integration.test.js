const test = require("node:test");
const assert = require("node:assert/strict");

const { setupFrontendApp } = require("../integration-test-setup.js");

async function seedDependencies(window, document) {
  document.getElementById("bank-name").value = "Subscription Bank";
  document.getElementById("bank-country").value = "US";
  document
    .getElementById("bank-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  document.getElementById("person-name").value = "Subscription Person";
  document
    .getElementById("people-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  document.getElementById("credit-card-bank-id").value = "1";
  document.getElementById("credit-card-person-id").value = "1";
  document.getElementById("credit-card-number").value = "5555444433332222";
  document.getElementById("credit-card-name").value = "Subscriptions Card";
  document
    .getElementById("credit-card-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

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
}

test("frontend can create, update and delete credit card subscriptions", async () => {
  const { dom, window, document } = await setupFrontendApp();

  document.querySelector('[data-route-tab="credit-cards"]').click();
  await seedDependencies(window, document);

  document.querySelector('[data-credit-card-tab="subscriptions"]').click();

  document.getElementById("credit-card-subscription-credit-card-id").value = "1";
  document.getElementById("credit-card-subscription-currency-id").value = "1";
  document.getElementById("credit-card-subscription-concept").value = "Streaming Service";
  document.getElementById("credit-card-subscription-amount").value = "19.99";
  document
    .getElementById("credit-card-subscription-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.equal(document.getElementById("credit-card-subscription-form-message").textContent, "Credit card subscription created");
  assert.match(document.getElementById("credit-card-subscriptions-body").textContent, /Streaming Service/);

  const editButton = document.querySelector('#credit-card-subscriptions-body button[data-action="edit"]');
  editButton.dispatchEvent(new window.Event("click", { bubbles: true }));

  document.getElementById("credit-card-subscription-concept").value = "Cloud Storage";
  document.getElementById("credit-card-subscription-amount").value = "9.99";
  document
    .getElementById("credit-card-subscription-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.equal(document.getElementById("credit-card-subscription-form-message").textContent, "Credit card subscription updated");
  assert.match(document.getElementById("credit-card-subscriptions-body").textContent, /Cloud Storage/);

  const deleteButton = document.querySelector('#credit-card-subscriptions-body button[data-action="delete"]');
  deleteButton.dispatchEvent(new window.Event("click", { bubbles: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.equal(document.getElementById("credit-card-subscription-form-message").textContent, "Credit card subscription deleted");
  assert.match(document.getElementById("credit-card-subscriptions-body").textContent, /No credit card subscriptions yet/);

  dom.window.close();
});

test("frontend blocks duplicate credit card subscription by card currency and concept", async () => {
  const { dom, window, document } = await setupFrontendApp();

  document.querySelector('[data-route-tab="credit-cards"]').click();
  await seedDependencies(window, document);

  document.querySelector('[data-credit-card-tab="subscriptions"]').click();

  document.getElementById("credit-card-subscription-credit-card-id").value = "1";
  document.getElementById("credit-card-subscription-currency-id").value = "1";
  document.getElementById("credit-card-subscription-concept").value = "Streaming Service";
  document.getElementById("credit-card-subscription-amount").value = "19.99";
  document
    .getElementById("credit-card-subscription-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  document.getElementById("credit-card-subscription-credit-card-id").value = "1";
  document.getElementById("credit-card-subscription-currency-id").value = "1";
  document.getElementById("credit-card-subscription-concept").value = "Streaming Service";
  document.getElementById("credit-card-subscription-amount").value = "29.99";
  document
    .getElementById("credit-card-subscription-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  assert.equal(
    document.getElementById("credit-card-subscription-form-message").textContent,
    "A credit card subscription with this concept already exists for the selected credit card and currency"
  );
  assert.equal(document.querySelectorAll("#credit-card-subscriptions-body tr").length, 1);

  dom.window.close();
});
