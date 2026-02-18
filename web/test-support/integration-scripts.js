const fs = require("node:fs");
const path = require("node:path");

const scriptFileNames = [
  "utils.js",
  "router.js",
  "app/dom.js",
  "app/state.js",
  "app/api.js",
  "app/routing.js",
  "app/modules.js",
  "modules/transaction-categories.js",
  "modules/currencies.js",
  "modules/banks.js",
  "modules/people.js",
  "modules/bank-accounts.js",
  "app/index.js",
];

function readAppHtml(webDir) {
  return fs.readFileSync(path.join(webDir, "index.html"), "utf8");
}

function readScriptSources(webDir) {
  return scriptFileNames.map((fileName) => fs.readFileSync(path.join(webDir, fileName), "utf8"));
}

function evaluateScripts(window, scriptSources) {
  for (const source of scriptSources) {
    window.eval(source);
  }
}

module.exports = {
  readAppHtml,
  readScriptSources,
  evaluateScripts,
};
