const path = require("node:path");
const { defineConfig } = require("@playwright/test");

const e2eDbPath = path.join("data", `e2e_${Date.now()}.db`);
const e2ePort = process.env.PLAYWRIGHT_E2E_PORT || "19777";
const e2eBaseUrl = `http://127.0.0.1:${e2ePort}`;

module.exports = defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  workers: 1,
  use: {
    baseURL: e2eBaseUrl,
    trace: "on-first-retry",
  },
  webServer: {
    command: "go run .",
    url: `${e2eBaseUrl}/api/health`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      DATABASE_PATH: e2eDbPath,
      PORT: String(e2ePort),
    },
  },
});