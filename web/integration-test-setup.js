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
  const currenciesModuleScript = fs.readFileSync(path.join(webDir, "currencies-module.js"), "utf8");
  const banksModuleScript = fs.readFileSync(path.join(webDir, "banks-module.js"), "utf8");
  const peopleModuleScript = fs.readFileSync(path.join(webDir, "people-module.js"), "utf8");
  const bankAccountsModuleScript = fs.readFileSync(path.join(webDir, "bank-accounts-module.js"), "utf8");
  const appScript = fs.readFileSync(path.join(webDir, "app.js"), "utf8");

  const dom = new JSDOM(html, {
    url: "http://localhost:8080",
    runScripts: "outside-only",
  });

  const { window } = dom;
  const { document } = window;

  let nextId = 1;
  const store = [];
  let nextPersonId = 1;
  const peopleStore = [];
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

    if (pathname === "/api/people" && method === "GET") {
      return createResponse(200, peopleStore.map((item) => ({ ...item })));
    }

    if (pathname === "/api/people" && method === "POST") {
      const payload = JSON.parse(options.body || "{}");
      const name = String(payload.name || "").trim();
      if (!name) {
        return createResponse(400, {
          error: {
            code: "invalid_payload",
            message: "name is required",
          },
        });
      }

      const created = {
        id: nextPersonId,
        name,
      };
      nextPersonId += 1;
      peopleStore.push(created);
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

    const personMatch = pathname.match(/^\/api\/people\/(\d+)$/);
    if (personMatch && method === "PUT") {
      const id = Number(personMatch[1]);
      const payload = JSON.parse(options.body || "{}");
      const name = String(payload.name || "").trim();
      if (!name) {
        return createResponse(400, {
          error: {
            code: "invalid_payload",
            message: "name is required",
          },
        });
      }

      const index = peopleStore.findIndex((item) => item.id === id);
      if (index === -1) {
        return createResponse(404, { error: { code: "not_found", message: "person not found" } });
      }

      const updated = {
        id,
        name,
      };
      peopleStore[index] = updated;
      return createResponse(200, updated);
    }

    if (personMatch && method === "DELETE") {
      const id = Number(personMatch[1]);
      const index = peopleStore.findIndex((item) => item.id === id);
      if (index === -1) {
        return createResponse(404, { error: { code: "not_found", message: "person not found" } });
      }
      peopleStore.splice(index, 1);
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
  window.eval(currenciesModuleScript);
  window.eval(banksModuleScript);
  window.eval(peopleModuleScript);
  window.eval(bankAccountsModuleScript);
  window.eval(appScript);

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  return { dom, window, document };
}

module.exports = { setupFrontendApp };
