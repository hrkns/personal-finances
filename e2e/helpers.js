async function waitForAppReady(page) {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForFunction(() => typeof window.frontendRouter !== "undefined");
  await page.waitForFunction(async () => {
    try {
      const response = await fetch("/api/health", { cache: "no-store" });
      return response.ok;
    } catch (_error) {
      return false;
    }
  });
}

async function openApp(page) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await waitForAppReady(page);
      return;
    } catch (error) {
      const message = String(error?.message || "");
      if (!message.includes("ERR_CONNECTION_REFUSED") || attempt === 4) {
        throw error;
      }
      await page.waitForTimeout(1000);
    }
  }
}

async function openSettingsSection(page, sectionName) {
  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByRole("button", { name: sectionName }).click();
}

function uniqueCurrencyCode(prefix) {
  return `${prefix}${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

module.exports = {
  waitForAppReady,
  openApp,
  openSettingsSection,
  uniqueCurrencyCode,
};
