const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");

const webDir = __dirname;

function createResponse(status, body) {
  return {
    status,
    ok: status >= 200 && status < 300,
    text: async () => (body === undefined ? "" : JSON.stringify(body)),
  };
}

function normalize(value) {
  return String(value).trim().toLowerCase();
}

async function setupFrontendApp() {
  const html = fs.readFileSync(path.join(webDir, "index.html"), "utf8");
  const utilsScript = fs.readFileSync(path.join(webDir, "utils.js"), "utf8");
  const routerScript = fs.readFileSync(path.join(webDir, "router.js"), "utf8");
  const appScript = fs.readFileSync(path.join(webDir, "app.js"), "utf8");

  const dom = new JSDOM(html, {
    url: "http://localhost:8080",
    runScripts: "outside-only",
  });

  const { window } = dom;
  const { document } = window;

  let nextId = 1;
  const store = [];
  let nextBankId = 1;
  const banksStore = [];
  let nextBankAccountId = 1;
  const bankAccountsStore = [];
  const countriesStore = [
    { code: "CA", name: "Canada" },
    { code: "GB", name: "United Kingdom" },
    { code: "US", name: "United States" },
  ];

  window.fetch = async (url, options = {}) => {
    const method = (options.method || "GET").toUpperCase();
    const parsedUrl = new URL(url, "http://localhost:8080");
    const pathname = parsedUrl.pathname;

    if (pathname === "/api/countries" && method === "GET") {
      return createResponse(200, countriesStore.map((item) => ({ ...item })));
    }

    if (pathname === "/api/currencies" && method === "GET") {
      return createResponse(200, store.map((item) => ({ ...item })));
    }

    if (pathname === "/api/currencies" && method === "POST") {
      const payload = JSON.parse(options.body || "{}");
      const duplicate = store.some(
        (item) => normalize(item.name) === normalize(payload.name) || normalize(item.code) === normalize(payload.code)
      );
      if (duplicate) {
        return createResponse(409, {
          error: {
            code: "duplicate_currency",
            message: "name and code must be unique",
          },
        });
      }

      const created = {
        id: nextId,
        name: String(payload.name).trim(),
        code: String(payload.code).trim().toUpperCase(),
      };
      nextId += 1;
      store.push(created);
      return createResponse(201, created);
    }

    const currencyMatch = pathname.match(/^\/api\/currencies\/(\d+)$/);
    if (currencyMatch && method === "PUT") {
      const id = Number(currencyMatch[1]);
      const payload = JSON.parse(options.body || "{}");
      const index = store.findIndex((item) => item.id === id);
      if (index === -1) {
        return createResponse(404, { error: { code: "not_found", message: "currency not found" } });
      }

      const duplicate = store.some(
        (item) =>
          item.id !== id &&
          (normalize(item.name) === normalize(payload.name) || normalize(item.code) === normalize(payload.code))
      );
      if (duplicate) {
        return createResponse(409, {
          error: {
            code: "duplicate_currency",
            message: "name and code must be unique",
          },
        });
      }

      const updated = {
        id,
        name: String(payload.name).trim(),
        code: String(payload.code).trim().toUpperCase(),
      };
      store[index] = updated;
      return createResponse(200, updated);
    }

    if (currencyMatch && method === "DELETE") {
      const id = Number(currencyMatch[1]);
      const index = store.findIndex((item) => item.id === id);
      if (index === -1) {
        return createResponse(404, { error: { code: "not_found", message: "currency not found" } });
      }
      store.splice(index, 1);
      return createResponse(204);
    }

    if (pathname === "/api/banks" && method === "GET") {
      return createResponse(200, banksStore.map((item) => ({ ...item })));
    }

    if (pathname === "/api/banks" && method === "POST") {
      const payload = JSON.parse(options.body || "{}");
      const normalizedCountry = normalize(payload.country);
      const duplicate = banksStore.some(
        (item) => normalize(item.name) === normalize(payload.name) && normalize(item.country) === normalizedCountry
      );
      if (duplicate) {
        return createResponse(409, {
          error: {
            code: "duplicate_bank",
            message: "name and country combination must be unique",
          },
        });
      }

      const created = {
        id: nextBankId,
        name: String(payload.name).trim(),
        country: String(payload.country).trim().toUpperCase(),
      };
      nextBankId += 1;
      banksStore.push(created);
      return createResponse(201, created);
    }

    if (pathname === "/api/bank-accounts" && method === "GET") {
      return createResponse(200, bankAccountsStore.map((item) => ({ ...item })));
    }

    if (pathname === "/api/bank-accounts" && method === "POST") {
      const payload = JSON.parse(options.body || "{}");
      const duplicate = bankAccountsStore.some(
        (item) =>
          item.bank_id === payload.bank_id &&
          item.currency_id === payload.currency_id &&
          item.account_number === payload.account_number
      );
      if (duplicate) {
        return createResponse(409, {
          error: {
            code: "duplicate_bank_account",
            message: "bank, currency and account number combination must be unique",
          },
        });
      }

      const created = {
        id: nextBankAccountId,
        bank_id: Number(payload.bank_id),
        currency_id: Number(payload.currency_id),
        account_number: String(payload.account_number).trim(),
        balance: Number(payload.balance),
      };
      nextBankAccountId += 1;
      bankAccountsStore.push(created);
      return createResponse(201, created);
    }

    const bankMatch = pathname.match(/^\/api\/banks\/(\d+)$/);
    if (bankMatch && method === "PUT") {
      const id = Number(bankMatch[1]);
      const payload = JSON.parse(options.body || "{}");
      const index = banksStore.findIndex((item) => item.id === id);
      if (index === -1) {
        return createResponse(404, { error: { code: "not_found", message: "bank not found" } });
      }

      const duplicate = banksStore.some(
        (item) =>
          item.id !== id &&
          normalize(item.name) === normalize(payload.name) &&
          normalize(item.country) === normalize(payload.country)
      );
      if (duplicate) {
        return createResponse(409, {
          error: {
            code: "duplicate_bank",
            message: "name and country combination must be unique",
          },
        });
      }

      const updated = {
        id,
        name: String(payload.name).trim(),
        country: String(payload.country).trim().toUpperCase(),
      };
      banksStore[index] = updated;
      return createResponse(200, updated);
    }

    if (bankMatch && method === "DELETE") {
      const id = Number(bankMatch[1]);
      const index = banksStore.findIndex((item) => item.id === id);
      if (index === -1) {
        return createResponse(404, { error: { code: "not_found", message: "bank not found" } });
      }
      banksStore.splice(index, 1);
      return createResponse(204);
    }

    const bankAccountMatch = pathname.match(/^\/api\/bank-accounts\/(\d+)$/);
    if (bankAccountMatch && method === "PUT") {
      const id = Number(bankAccountMatch[1]);
      const payload = JSON.parse(options.body || "{}");
      const index = bankAccountsStore.findIndex((item) => item.id === id);
      if (index === -1) {
        return createResponse(404, { error: { code: "not_found", message: "bank account not found" } });
      }

      const duplicate = bankAccountsStore.some(
        (item) =>
          item.id !== id &&
          item.bank_id === Number(payload.bank_id) &&
          item.currency_id === Number(payload.currency_id) &&
          item.account_number === String(payload.account_number).trim()
      );
      if (duplicate) {
        return createResponse(409, {
          error: {
            code: "duplicate_bank_account",
            message: "bank, currency and account number combination must be unique",
          },
        });
      }

      const updated = {
        id,
        bank_id: Number(payload.bank_id),
        currency_id: Number(payload.currency_id),
        account_number: String(payload.account_number).trim(),
        balance: Number(payload.balance),
      };
      bankAccountsStore[index] = updated;
      return createResponse(200, updated);
    }

    if (bankAccountMatch && method === "DELETE") {
      const id = Number(bankAccountMatch[1]);
      const index = bankAccountsStore.findIndex((item) => item.id === id);
      if (index === -1) {
        return createResponse(404, { error: { code: "not_found", message: "bank account not found" } });
      }
      bankAccountsStore.splice(index, 1);
      return createResponse(204);
    }

    return createResponse(500, { error: { code: "unhandled", message: "unhandled route in test" } });
  };

  window.eval(utilsScript);
  window.eval(routerScript);
  window.eval(appScript);

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  return { dom, window, document };
}

test("frontend initializes at Home route and can route to Currency", async () => {
  const { dom, document } = await setupFrontendApp();

  const homeHidden = document.getElementById("view-home").hidden;
  const bankAccountsHiddenBefore = document.getElementById("view-bank-accounts").hidden;
  const currencyHiddenBefore = document.getElementById("view-currency").hidden;

  document.querySelector('[data-route-tab="currency"]').click();

  const currencyHiddenAfter = document.getElementById("view-currency").hidden;
  const emptyState = document.getElementById("currencies-body").textContent;
  const emptyBanksState = document.getElementById("banks-body").textContent;
  const emptyBankAccountsState = document.getElementById("bank-accounts-body").textContent;
  const countryOptions = document.getElementById("bank-country").textContent;
  const bankAccountCurrencyOptions = document.getElementById("bank-account-currency-id").textContent;

  assert.equal(homeHidden, false);
  assert.equal(bankAccountsHiddenBefore, true);
  assert.equal(currencyHiddenBefore, true);
  assert.equal(currencyHiddenAfter, false);
  assert.match(emptyState, /No currencies yet/);
  assert.match(emptyBanksState, /No banks yet/);
  assert.match(emptyBankAccountsState, /No bank accounts yet/);
  assert.match(countryOptions, /US - United States/);
  assert.match(bankAccountCurrencyOptions, /Select currency/);

  dom.window.close();
});

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