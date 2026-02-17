const { JSDOM } = require("jsdom");
const { createFetchMock } = require("./test-support/integration-fetch-mock.js");
const { readAppHtml, readScriptSources, evaluateScripts } = require("./test-support/integration-scripts.js");

const webDir = __dirname;

async function setupFrontendApp() {
  const html = readAppHtml(webDir);
  const scriptSources = readScriptSources(webDir);

  const dom = new JSDOM(html, {
    url: "http://localhost:8080",
    runScripts: "outside-only",
  });

  const { window } = dom;
  const { document } = window;
  window.fetch = createFetchMock();
  evaluateScripts(window, scriptSources);

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  return { dom, window, document };
}

module.exports = { setupFrontendApp };
