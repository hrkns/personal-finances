const test = require("node:test");
const assert = require("node:assert/strict");

const { buildExpenseFrequencyPeriodKey } = require("./helpers.js");

test("buildExpenseFrequencyPeriodKey handles years 0000-0099 without Date.UTC offset", () => {
  assert.equal(buildExpenseFrequencyPeriodKey("0001-01-01", "daily"), "1-01-01");
  assert.equal(buildExpenseFrequencyPeriodKey("0001-01-15", "monthly"), "1-01");
  assert.equal(buildExpenseFrequencyPeriodKey("0099-12-31", "annually"), "99");
  assert.equal(buildExpenseFrequencyPeriodKey("0001-01-01", "weekly"), "1-W01");
});
