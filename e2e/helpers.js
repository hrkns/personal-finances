async function openSettingsSection(page, sectionName) {
  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByRole("button", { name: sectionName }).click();
}

module.exports = {
  openSettingsSection,
};
