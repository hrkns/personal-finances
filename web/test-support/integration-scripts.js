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
  "modules/transactions.js",
  "modules/people.js",
  "modules/currencies.js",
  "modules/banks.js",
  "modules/bank-accounts.js",
  "app/index.js",
];

function readAppHtml(webDir) {
  return fs.readFileSync(path.join(webDir, "index.html"), "utf8");
}

function extractScriptFileNamesFromHtml(html) {
  const scriptSources = [];
  const scriptTagRegex = /<script\s+[^>]*src=["']([^"']+)["'][^>]*>\s*<\/script>/gi;

  for (const match of html.matchAll(scriptTagRegex)) {
    scriptSources.push(match[1]);
  }

  return scriptSources;
}

function assertScriptOrderMatchesHtml(webDir) {
  const html = readAppHtml(webDir);
  const htmlScriptFileNames = extractScriptFileNamesFromHtml(html);

  if (JSON.stringify(htmlScriptFileNames) !== JSON.stringify(scriptFileNames)) {
    throw new Error(
      "scriptFileNames in web/test-support/integration-scripts.js must match <script src> order in web/index.html"
    );
  }
}

function readScriptSources(webDir) {
  assertScriptOrderMatchesHtml(webDir);
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
