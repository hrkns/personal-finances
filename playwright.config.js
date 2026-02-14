const path = require("node:path");
const { defineConfig } = require("@playwright/test");

const e2eDbPath = path.join("data", `e2e_${Date.now()}.db`);

module.exports = defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:8080",
    trace: "on-first-retry",
  },
  webServer: {
    command: "go run .",
    url: "http://127.0.0.1:8080/api/health",
    reuseExistingServer: true,
    timeout: 120_000,
    env: {
      DATABASE_PATH: e2eDbPath,
    },
  },
});