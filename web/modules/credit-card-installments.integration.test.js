const test = require("node:test");
const assert = require("node:assert/strict");

const { setupFrontendApp } = require("../integration-test-setup.js");

async function createBankPersonAndCreditCard(window, document) {
  document.getElementById("bank-name").value = "Installment Bank";
  document.getElementById("bank-country").value = "US";
  document
    .getElementById("bank-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  document.getElementById("person-name").value = "Installment Person";
  document
    .getElementById("people-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  document.getElementById("credit-card-bank-id").value = "1";
  document.getElementById("credit-card-person-id").value = "1";
  document.getElementById("credit-card-number").value = "500011112222";
  document.getElementById("credit-card-name").value = "Installment Card";
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

  document.getElementById("currency-name").value = "Euro";
  document.getElementById("currency-code").value = "EUR";
  document
    .getElementById("currency-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  document.querySelector('[data-route-tab="credit-cards"]').click();
}

test("frontend can create, update and delete credit card installments", async () => {
  const { dom, window, document } = await setupFrontendApp();

  document.querySelector('[data-route-tab="credit-cards"]').click();
  await createBankPersonAndCreditCard(window, document);

  document.querySelector('[data-credit-card-tab="installments"]').click();

  document.getElementById("credit-card-installment-credit-card-id").value = "1";
  document.getElementById("credit-card-installment-currency-id").value = "1";
  document.getElementById("credit-card-installment-concept").value = "Laptop";
  document.getElementById("credit-card-installment-amount").value = "1200.75";
  document.getElementById("credit-card-installment-start-date").value = "2026-03-01";
  document.getElementById("credit-card-installment-count").value = "12";
  document
    .getElementById("credit-card-installment-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.equal(document.getElementById("credit-card-installment-form-message").textContent, "Credit card installment created");
  assert.match(document.getElementById("credit-card-installments-body").textContent, /Laptop/);
  assert.match(document.getElementById("credit-card-installments-body").textContent, /1200.75/);

  const editButton = document.querySelector('#credit-card-installments-body button[data-action="edit"]');
  editButton.dispatchEvent(new window.Event("click", { bubbles: true }));

  document.getElementById("credit-card-installment-concept").value = "Laptop Updated";
  document.getElementById("credit-card-installment-amount").value = "1000";
  document.getElementById("credit-card-installment-start-date").value = "2026-04-01";
  document.getElementById("credit-card-installment-count").value = "10";
  document
    .getElementById("credit-card-installment-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.equal(document.getElementById("credit-card-installment-form-message").textContent, "Credit card installment updated");
  assert.match(document.getElementById("credit-card-installments-body").textContent, /Laptop Updated/);

  const deleteButton = document.querySelector('#credit-card-installments-body button[data-action="delete"]');
  deleteButton.dispatchEvent(new window.Event("click", { bubbles: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.equal(document.getElementById("credit-card-installment-form-message").textContent, "Credit card installment deleted");
  assert.match(document.getElementById("credit-card-installments-body").textContent, /No credit card installments yet/);

  dom.window.close();
});

test("frontend validates unique concept per credit card and currency installment", async () => {
  const { dom, window, document } = await setupFrontendApp();

  document.querySelector('[data-route-tab="credit-cards"]').click();
  await createBankPersonAndCreditCard(window, document);

  document.querySelector('[data-credit-card-tab="installments"]').click();

  document.getElementById("credit-card-installment-credit-card-id").value = "1";
  document.getElementById("credit-card-installment-currency-id").value = "1";
  document.getElementById("credit-card-installment-concept").value = "Phone";
  document.getElementById("credit-card-installment-amount").value = "800";
  document.getElementById("credit-card-installment-start-date").value = "2026-05-01";
  document.getElementById("credit-card-installment-count").value = "8";
  document
    .getElementById("credit-card-installment-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  document.getElementById("credit-card-installment-credit-card-id").value = "1";
  document.getElementById("credit-card-installment-currency-id").value = "1";
  document.getElementById("credit-card-installment-concept").value = "Phone";
  document.getElementById("credit-card-installment-amount").value = "300";
  document.getElementById("credit-card-installment-start-date").value = "2026-06-01";
  document.getElementById("credit-card-installment-count").value = "3";
  document
    .getElementById("credit-card-installment-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.equal(
    document.getElementById("credit-card-installment-form-message").textContent,
    "A credit card installment with this concept already exists for the selected credit card and currency"
  );

  document.getElementById("credit-card-installment-credit-card-id").value = "1";
  document.getElementById("credit-card-installment-currency-id").value = "2";
  document.getElementById("credit-card-installment-concept").value = "Phone";
  document.getElementById("credit-card-installment-amount").value = "300";
  document.getElementById("credit-card-installment-start-date").value = "2026-06-01";
  document.getElementById("credit-card-installment-count").value = "3";
  document
    .getElementById("credit-card-installment-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.equal(document.getElementById("credit-card-installment-form-message").textContent, "Credit card installment created");
  assert.equal(document.querySelectorAll("#credit-card-installments-body tr").length, 2);

  dom.window.close();
});
