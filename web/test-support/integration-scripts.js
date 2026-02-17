const fs = require("node:fs");
const path = require("node:path");

const scriptFileNames = [
  "utils.js",
  "router.js",
  "transaction-categories-module.js",
  "currencies-module.js",
  "banks-module.js",
  "people-module.js",
  "bank-accounts-module.js",
  "app.js",
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
