const test = require("node:test");
const assert = require("node:assert/strict");

const {
  normalizeCurrencyInput,
  normalizeBankInput,
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
