const test = require("node:test");
const assert = require("node:assert/strict");

const { setupFrontendApp } = require("../integration-test-setup.js");

async function flush() {
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
}

async function seedTransactionDependencies(window, document) {
  document.querySelector('[data-route-tab="settings"]').click();
  document.querySelector('[data-settings-tab="people"]').click();
  document.getElementById("person-name").value = "Jane Doe";
  document.getElementById("person-form").dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
  await flush();

  document.querySelector('[data-route-tab="transactions"]').click();
  document.querySelector('[data-transactions-tab="transaction-categories"]').click();
  document.getElementById("transaction-category-name").value = "Salary";
  document
    .getElementById("transaction-category-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
  await flush();

  document.querySelector('[data-route-tab="settings"]').click();
  document.querySelector('[data-settings-tab="currencies"]').click();
  document.getElementById("currency-name").value = "US Dollar";
  document.getElementById("currency-code").value = "USD";
  document.getElementById("currency-form").dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
  await flush();

  document.querySelector('[data-route-tab="settings"]').click();
  document.querySelector('[data-settings-tab="banks"]').click();
  document.getElementById("bank-name").value = "Bank One";
  document.getElementById("bank-country").value = "US";
  document.getElementById("bank-form").dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
  await flush();

  document.querySelector('[data-route-tab="settings"]').click();
  document.querySelector('[data-settings-tab="bank-accounts"]').click();
  document.getElementById("bank-account-bank-id").value = "1";
  document.getElementById("bank-account-currency-id").value = "1";
  document.getElementById("bank-account-number").value = "ACC-001";
  document.getElementById("bank-account-balance").value = "100";
  document
    .getElementById("bank-account-form")
    .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
  await flush();
}

test("frontend can create and list a transaction", async () => {
  const { dom, window, document } = await setupFrontendApp();

  await seedTransactionDependencies(window, document);

  document.querySelector('[data-route-tab="transactions"]').click();
  document.getElementById("transaction-date").value = "2026-02-18";
  document.getElementById("transaction-type").value = "income";
  document.getElementById("transaction-amount").value = "1200.50";
  document.getElementById("transaction-person-id").value = "1";
  document.getElementById("transaction-bank-account-id").value = "1";
  document.getElementById("transaction-category-id-input").value = "1";
  document.getElementById("transaction-notes").value = "Salary payment";

  document.getElementById("transaction-form").dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
  await flush();

  const message = document.getElementById("transaction-form-message").textContent;
  const rowsText = document.getElementById("transactions-body").textContent;

  assert.equal(message, "Transaction created");
  assert.match(rowsText, /2026-02-18/);
  assert.match(rowsText, /income/);
  assert.match(rowsText, /Salary payment/);
  assert.match(rowsText, /Jane Doe/);
  assert.match(rowsText, /Salary/);
  assert.match(rowsText, /1300.50/);

  dom.window.close();
});

test("frontend shows running bank-account balance per transaction row", async () => {
  const { dom, window, document } = await setupFrontendApp();

  await seedTransactionDependencies(window, document);

  document.querySelector('[data-route-tab="transactions"]').click();

  document.getElementById("transaction-date").value = "2026-02-18";
  document.getElementById("transaction-type").value = "income";
  document.getElementById("transaction-amount").value = "300";
  document.getElementById("transaction-person-id").value = "1";
  document.getElementById("transaction-bank-account-id").value = "1";
  document.getElementById("transaction-category-id-input").value = "1";
  document.getElementById("transaction-form").dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
  await flush();

  document.getElementById("transaction-date").value = "2026-02-19";
  document.getElementById("transaction-type").value = "expense";
  document.getElementById("transaction-amount").value = "120";
  document.getElementById("transaction-person-id").value = "1";
  document.getElementById("transaction-bank-account-id").value = "1";
  document.getElementById("transaction-category-id-input").value = "1";
  document.getElementById("transaction-form").dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
  await flush();

  const rows = document.querySelectorAll("#transactions-body tr");
  assert.equal(rows.length, 2);

  const rowByDate = new Map(
    Array.from(rows, (row) => {
      const cells = row.querySelectorAll("td");
      return [cells[1].textContent, cells[6].textContent];
    })
  );

  assert.equal(rowByDate.get("2026-02-18"), "400.00");
  assert.equal(rowByDate.get("2026-02-19"), "280.00");

  dom.window.close();
});

test("frontend supports transaction edit and delete actions", async () => {
  const { dom, window, document } = await setupFrontendApp();

  await seedTransactionDependencies(window, document);

  document.querySelector('[data-route-tab="transactions"]').click();
  document.getElementById("transaction-date").value = "2026-02-18";
  document.getElementById("transaction-type").value = "income";
  document.getElementById("transaction-amount").value = "100";
  document.getElementById("transaction-person-id").value = "1";
  document.getElementById("transaction-bank-account-id").value = "1";
  document.getElementById("transaction-category-id-input").value = "1";
  document.getElementById("transaction-form").dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
  await flush();

  const editButton = document.querySelector('#transactions-body button[data-action="edit"][data-id="1"]');
  editButton.dispatchEvent(new window.Event("click", { bubbles: true }));

  assert.equal(document.getElementById("transaction-submit-button").textContent, "Update");

  document.getElementById("transaction-type").value = "expense";
  document.getElementById("transaction-amount").value = "50.25";
  document.getElementById("transaction-notes").value = "Groceries";
  document.getElementById("transaction-form").dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
  await flush();

  const rowsAfterUpdate = document.getElementById("transactions-body").textContent;
  assert.match(rowsAfterUpdate, /expense/);
  assert.match(rowsAfterUpdate, /50.25/);
  assert.match(rowsAfterUpdate, /Groceries/);

  const deleteButton = document.querySelector('#transactions-body button[data-action="delete"][data-id="1"]');
  deleteButton.dispatchEvent(new window.Event("click", { bubbles: true }));
  await flush();

  assert.match(document.getElementById("transactions-body").textContent, /No transactions yet/);

  dom.window.close();
});

test("frontend shows validation error for invalid transaction payload", async () => {
  const { dom, window, document } = await setupFrontendApp();

  await seedTransactionDependencies(window, document);

  document.querySelector('[data-route-tab="transactions"]').click();
  document.getElementById("transaction-date").value = "";
  document.getElementById("transaction-type").value = "income";
  document.getElementById("transaction-amount").value = "100";
  document.getElementById("transaction-person-id").value = "1";
  document.getElementById("transaction-bank-account-id").value = "1";
  document.getElementById("transaction-category-id-input").value = "1";

  document.getElementById("transaction-form").dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
  await flush();

  const message = document.getElementById("transaction-form-message");
  assert.equal(message.textContent, "transaction_date must be a valid date in YYYY-MM-DD format");

  const toastElement = document.getElementById("transaction-form-toast");
  if (window.bootstrap?.Toast) {
    assert.match(toastElement.className, /text-bg-danger/);
  } else {
    assert.equal(message.className, "error");
  }

  dom.window.close();
});

test("frontend applies valid transaction sorting from URL params", async () => {
  const { dom, window, document } = await setupFrontendApp({
    initialUrl: "http://localhost:8080/?view=transactions&transactions=list&transactionsSort=amount&transactionsOrder=asc",
  });

  await seedTransactionDependencies(window, document);

  document.querySelector('[data-route-tab="transactions"]').click();

  document.getElementById("transaction-date").value = "2026-02-20";
  document.getElementById("transaction-type").value = "income";
  document.getElementById("transaction-amount").value = "300";
  document.getElementById("transaction-person-id").value = "1";
  document.getElementById("transaction-bank-account-id").value = "1";
  document.getElementById("transaction-category-id-input").value = "1";
  document.getElementById("transaction-form").dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
  await flush();

  document.getElementById("transaction-date").value = "2026-02-21";
  document.getElementById("transaction-type").value = "income";
  document.getElementById("transaction-amount").value = "120";
  document.getElementById("transaction-person-id").value = "1";
  document.getElementById("transaction-bank-account-id").value = "1";
  document.getElementById("transaction-category-id-input").value = "1";
  document.getElementById("transaction-form").dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
  await flush();

  const rows = document.querySelectorAll("#transactions-body tr");
  assert.equal(rows.length, 2);

  const firstRowCells = rows[0].querySelectorAll("td");
  const secondRowCells = rows[1].querySelectorAll("td");

  assert.equal(firstRowCells[3].textContent, "120.00");
  assert.equal(secondRowCells[3].textContent, "300.00");

  dom.window.close();
});

test("frontend removes invalid transaction sorting params and falls back to default sorting", async () => {
  const { dom, window, document } = await setupFrontendApp({
    initialUrl: "http://localhost:8080/?view=transactions&transactions=list&transactionsSort=invalid&transactionsOrder=sideways",
  });

  await seedTransactionDependencies(window, document);

  document.querySelector('[data-route-tab="transactions"]').click();

  document.getElementById("transaction-date").value = "2026-02-18";
  document.getElementById("transaction-type").value = "income";
  document.getElementById("transaction-amount").value = "300";
  document.getElementById("transaction-person-id").value = "1";
  document.getElementById("transaction-bank-account-id").value = "1";
  document.getElementById("transaction-category-id-input").value = "1";
  document.getElementById("transaction-form").dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
  await flush();

  document.getElementById("transaction-date").value = "2026-02-19";
  document.getElementById("transaction-type").value = "income";
  document.getElementById("transaction-amount").value = "120";
  document.getElementById("transaction-person-id").value = "1";
  document.getElementById("transaction-bank-account-id").value = "1";
  document.getElementById("transaction-category-id-input").value = "1";
  document.getElementById("transaction-form").dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
  await flush();

  assert.equal(window.location.search.includes("transactionsSort="), false);
  assert.equal(window.location.search.includes("transactionsOrder="), false);

  const rows = document.querySelectorAll("#transactions-body tr");
  assert.equal(rows.length, 2);

  const firstRowCells = rows[0].querySelectorAll("td");
  const secondRowCells = rows[1].querySelectorAll("td");

  assert.equal(firstRowCells[1].textContent, "2026-02-19");
  assert.equal(secondRowCells[1].textContent, "2026-02-18");

  dom.window.close();
});
