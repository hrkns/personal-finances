async function openSettingsSection(page, sectionName) {
  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByRole("button", { name: sectionName }).click();
}

function uniqueCurrencyCode(prefix) {
  return `${prefix}${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

module.exports = {
  openSettingsSection,
  uniqueCurrencyCode,
};
