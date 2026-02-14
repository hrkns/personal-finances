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
  const appScript = fs.readFileSync(path.join(webDir, "app.js"), "utf8");

  const dom = new JSDOM(html, {
    url: "http://localhost:8080",
    runScripts: "outside-only",
  });

  const { window } = dom;
  const { document } = window;

  let nextId = 1;
  const store = [];

  window.fetch = async (url, options = {}) => {
    const method = (options.method || "GET").toUpperCase();
    const parsedUrl = new URL(url, "http://localhost:8080");
    const pathname = parsedUrl.pathname;

    if (pathname === "/api/health" && method === "GET") {
      return createResponse(200, { status: "ok", message: "backend is up" });
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

    return createResponse(500, { error: { code: "unhandled", message: "unhandled route in test" } });
  };

  window.eval(utilsScript);
  window.eval(appScript);

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  return { dom, window, document };
}

test("frontend initializes health and empty currencies state", async () => {
  const { dom, document } = await setupFrontendApp();

  const health = document.getElementById("health-status").textContent;
  const emptyState = document.getElementById("currencies-body").textContent;

  assert.match(health, /Backend status: backend is up/);
  assert.match(emptyState, /No currencies yet/);

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