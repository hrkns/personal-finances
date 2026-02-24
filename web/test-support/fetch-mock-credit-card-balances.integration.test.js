const test = require("node:test");
const assert = require("node:assert/strict");

const { createFetchMock } = require("./integration-fetch-mock.js");

async function parseJson(response) {
  const body = await response.text();
  return body ? JSON.parse(body) : null;
}

async function postJson(fetchMock, path, payload) {
  return fetchMock(path, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

async function putJson(fetchMock, path, payload) {
  return fetchMock(path, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

async function seedCreditCardCycleDependencies(fetchMock) {
  const bankResponse = await postJson(fetchMock, "/api/banks", { name: "Seed Bank", country: "US" });
  assert.equal(bankResponse.status, 201);

  const personResponse = await postJson(fetchMock, "/api/people", { name: "Seed Person" });
  assert.equal(personResponse.status, 201);

  const currencyResponse = await postJson(fetchMock, "/api/currencies", { name: "US Dollar", code: "USD" });
  assert.equal(currencyResponse.status, 201);

  const creditCardResponse = await postJson(fetchMock, "/api/credit-cards", {
    bank_id: 1,
    person_id: 1,
    number: "4111222233334444",
  });
  assert.equal(creditCardResponse.status, 201);

  const cycleResponse = await postJson(fetchMock, "/api/credit-card-cycles", {
    credit_card_id: 1,
    closing_date: "2026-03-20",
    due_date: "2026-03-30",
  });
  assert.equal(cycleResponse.status, 201);
}

test("fetch mock defaults omitted balance and paid on cycle balance create", async () => {
  const fetchMock = createFetchMock();
  await seedCreditCardCycleDependencies(fetchMock);

  const createResponse = await postJson(fetchMock, "/api/credit-card-cycles/1/balances", {
    credit_card_cycle_id: 1,
    currency_id: 1,
  });

  assert.equal(createResponse.status, 201);
  const created = await parseJson(createResponse);
  assert.equal(created.balance, 0);
  assert.equal(created.paid, false);
});

test("fetch mock defaults omitted balance and paid on cycle balance update", async () => {
  const fetchMock = createFetchMock();
  await seedCreditCardCycleDependencies(fetchMock);

  const createResponse = await postJson(fetchMock, "/api/credit-card-cycles/1/balances", {
    credit_card_cycle_id: 1,
    currency_id: 1,
    balance: 123.45,
    paid: true,
  });
  assert.equal(createResponse.status, 201);

  const updateResponse = await putJson(fetchMock, "/api/credit-card-cycles/1/balances/1", {
    credit_card_cycle_id: 1,
    currency_id: 1,
  });

  assert.equal(updateResponse.status, 200);
  const updated = await parseJson(updateResponse);
  assert.equal(updated.balance, 0);
  assert.equal(updated.paid, false);
});
