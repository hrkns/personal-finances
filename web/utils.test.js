const test = require("node:test");
const assert = require("node:assert/strict");

const {
  normalizeCurrencyInput,
  normalizeBankInput,
  normalizePersonInput,
  normalizeTransactionCategoryInput,
  normalizeBankAccountInput,
  escapeHtml,
  parseApiResponse,
} = require("./utils.js");

test("normalizeCurrencyInput trims and uppercases code", () => {
  const payload = normalizeCurrencyInput("  US Dollar  ", " usd ");

  assert.deepEqual(payload, {
    name: "US Dollar",
    code: "USD",
  });
});

test("normalizeBankInput trims and uppercases country", () => {
  const payload = normalizeBankInput("  My Bank  ", " us ");

  assert.deepEqual(payload, {
    name: "My Bank",
    country: "US",
  });
});

test("normalizePersonInput trims name", () => {
  const payload = normalizePersonInput("  John Doe  ");

  assert.deepEqual(payload, {
    name: "John Doe",
  });
});

test("normalizeTransactionCategoryInput trims name and parses optional parent id", () => {
  const withParent = normalizeTransactionCategoryInput("  Job 1  ", " 2 ");
  assert.deepEqual(withParent, {
    name: "Job 1",
    parent_id: 2,
  });

  const withoutParent = normalizeTransactionCategoryInput(" Salary ", "");
  assert.deepEqual(withoutParent, {
    name: "Salary",
    parent_id: null,
  });
});

test("normalizeBankAccountInput parses ids and balance", () => {
  const payload = normalizeBankAccountInput(" 2 ", " 4 ", " ACC-01 ", " 10.25 ");

  assert.deepEqual(payload, {
    bank_id: 2,
    currency_id: 4,
    account_number: "ACC-01",
    balance: 10.25,
  });
});

test("escapeHtml escapes unsafe characters", () => {
  const escaped = escapeHtml(`<script>alert('x') & \"y\"</script>`);

  assert.equal(
    escaped,
    "&lt;script&gt;alert(&#039;x&#039;) &amp; &quot;y&quot;&lt;/script&gt;"
  );
});

test("parseApiResponse returns null for 204", async () => {
  const response = {
    status: 204,
    ok: true,
    text: async () => "",
  };

  const result = await parseApiResponse(response);
  assert.equal(result, null);
});

test("parseApiResponse throws formatted API error", async () => {
  const response = {
    status: 409,
    ok: false,
    text: async () => JSON.stringify({
      error: {
        code: "duplicate_currency",
        message: "name and code must be unique",
      },
    }),
  };

  await assert.rejects(
    () => parseApiResponse(response),
    /name and code must be unique/
  );
});
