const formElement = document.getElementById("currency-form");
const currencyIdElement = document.getElementById("currency-id");
const currencyNameElement = document.getElementById("currency-name");
const currencyCodeElement = document.getElementById("currency-code");
const submitButtonElement = document.getElementById("submit-button");
const cancelButtonElement = document.getElementById("cancel-button");
const messageElement = document.getElementById("form-message");
const currenciesBodyElement = document.getElementById("currencies-body");

const bankFormElement = document.getElementById("bank-form");
const bankIdElement = document.getElementById("bank-id");
const bankNameElement = document.getElementById("bank-name");
const bankCountryElement = document.getElementById("bank-country");
const bankSubmitButtonElement = document.getElementById("bank-submit-button");
const bankCancelButtonElement = document.getElementById("bank-cancel-button");
const bankMessageElement = document.getElementById("bank-form-message");
const banksBodyElement = document.getElementById("banks-body");
const bankAccountFormElement = document.getElementById("bank-account-form");
const bankAccountIdElement = document.getElementById("bank-account-id");
const bankAccountBankIdElement = document.getElementById("bank-account-bank-id");
const bankAccountCurrencyIdElement = document.getElementById("bank-account-currency-id");
const bankAccountNumberElement = document.getElementById("bank-account-number");
const bankAccountBalanceElement = document.getElementById("bank-account-balance");
const bankAccountSubmitButtonElement = document.getElementById("bank-account-submit-button");
const bankAccountCancelButtonElement = document.getElementById("bank-account-cancel-button");
const bankAccountMessageElement = document.getElementById("bank-account-form-message");
const bankAccountsBodyElement = document.getElementById("bank-accounts-body");
const tabButtonElements = document.querySelectorAll("[data-route-tab]");
const viewHomeElement = document.getElementById("view-home");
const viewBankAccountsElement = document.getElementById("view-bank-accounts");
const viewBanksElement = document.getElementById("view-banks");
const viewCurrencyElement = document.getElementById("view-currency");

const { normalizeCurrencyInput, normalizeBankInput, normalizeBankAccountInput, escapeHtml, parseApiResponse } = frontendUtils;


let currencies = [];
let banks = [];
let bankAccounts = [];

init();

async function init() {
  await loadCountryOptions();
  const initialRoute = frontendRouter.ensureValidRoute();
  applyRoute(initialRoute);

  frontendRouter.onRouteChange(applyRoute);

  tabButtonElements.forEach((button) => {
    button.addEventListener("click", () => {
      const route = button.getAttribute("data-route-tab");
      frontendRouter.navigate(route);
    });
  });

  await Promise.all([loadCurrencies(), loadBanks(), loadBankAccounts()]);

  formElement.addEventListener("submit", onFormSubmit);
  cancelButtonElement.addEventListener("click", resetForm);
  bankFormElement.addEventListener("submit", onBankFormSubmit);
  bankCancelButtonElement.addEventListener("click", resetBankForm);
  bankAccountFormElement.addEventListener("submit", onBankAccountFormSubmit);
  bankAccountCancelButtonElement.addEventListener("click", resetBankAccountForm);
}

async function loadCountryOptions() {
  try {
    const countries = await apiRequest("/api/countries", { method: "GET" });
    populateBankCountryOptions(countries);
  } catch (error) {
    setBankMessage(error.message, true);
  }
}

function applyRoute(route) {
  const activeRoute = route || "home";

  viewHomeElement.hidden = activeRoute !== "home";
  viewBankAccountsElement.hidden = activeRoute !== "bank-accounts";
  viewBanksElement.hidden = activeRoute !== "banks";
  viewCurrencyElement.hidden = activeRoute !== "currency";

  tabButtonElements.forEach((button) => {
    const tabRoute = button.getAttribute("data-route-tab");
    button.classList.toggle("active", tabRoute === activeRoute);
  });
}

async function loadCurrencies() {
  try {
    currencies = await apiRequest("/api/currencies", { method: "GET" });
    renderCurrencies();
    populateBankAccountCurrencyOptions();
    renderBankAccounts();
  } catch (error) {
    setMessage(error.message, true);
  }
}

async function loadBanks() {
  try {
    banks = await apiRequest("/api/banks", { method: "GET" });
    renderBanks();
    populateBankAccountBankOptions();
    renderBankAccounts();
  } catch (error) {
    setBankMessage(error.message, true);
  }
}

async function loadBankAccounts() {
  try {
    bankAccounts = await apiRequest("/api/bank-accounts", { method: "GET" });
    renderBankAccounts();
  } catch (error) {
    setBankAccountMessage(error.message, true);
  }
}

function renderCurrencies() {
  currenciesBodyElement.innerHTML = "";

  if (currencies.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 4;
    cell.textContent = "No currencies yet";
    row.appendChild(cell);
    currenciesBodyElement.appendChild(row);
    return;
  }

  for (const currency of currencies) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${currency.id}</td>
      <td>${escapeHtml(currency.name)}</td>
      <td>${escapeHtml(currency.code)}</td>
      <td>
        <button type="button" data-action="edit" data-id="${currency.id}">Edit</button>
        <button type="button" data-action="delete" data-id="${currency.id}">Delete</button>
      </td>
    `;
    currenciesBodyElement.appendChild(row);
  }

  currenciesBodyElement.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", onRowAction);
  });
}

function renderBanks() {
  banksBodyElement.innerHTML = "";

  if (banks.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 4;
    cell.textContent = "No banks yet";
    row.appendChild(cell);
    banksBodyElement.appendChild(row);
    return;
  }

  for (const bank of banks) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${bank.id}</td>
      <td>${escapeHtml(bank.name)}</td>
      <td>${escapeHtml(bank.country)}</td>
      <td>
        <button type="button" data-action="edit" data-id="${bank.id}">Edit</button>
        <button type="button" data-action="delete" data-id="${bank.id}">Delete</button>
      </td>
    `;
    banksBodyElement.appendChild(row);
  }

  banksBodyElement.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", onBankRowAction);
  });
}

function renderBankAccounts() {
  bankAccountsBodyElement.innerHTML = "";

  if (bankAccounts.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 6;
    cell.textContent = "No bank accounts yet";
    row.appendChild(cell);
    bankAccountsBodyElement.appendChild(row);
    return;
  }

  for (const bankAccount of bankAccounts) {
    const row = document.createElement("tr");
    const bankLabel = formatBankLabel(bankAccount.bank_id);
    const currencyLabel = formatCurrencyLabel(bankAccount.currency_id);
    row.innerHTML = `
      <td>${bankAccount.id}</td>
      <td>${escapeHtml(bankLabel)}</td>
      <td>${escapeHtml(currencyLabel)}</td>
      <td>${escapeHtml(bankAccount.account_number)}</td>
      <td>${escapeHtml(Number(bankAccount.balance).toFixed(2))}</td>
      <td>
        <button type="button" data-action="edit" data-id="${bankAccount.id}">Edit</button>
        <button type="button" data-action="delete" data-id="${bankAccount.id}">Delete</button>
      </td>
    `;
    bankAccountsBodyElement.appendChild(row);
  }

  bankAccountsBodyElement.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", onBankAccountRowAction);
  });
}

async function onFormSubmit(event) {
  event.preventDefault();

  const id = currencyIdElement.value.trim();
  const payload = normalizeCurrencyInput(currencyNameElement.value, currencyCodeElement.value);

  try {
    if (id) {
      await apiRequest(`/api/currencies/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setMessage("Currency updated", false);
    } else {
      await apiRequest("/api/currencies", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setMessage("Currency created", false);
    }

    resetForm();
    await loadCurrencies();
  } catch (error) {
    setMessage(error.message, true);
  }
}

async function onBankFormSubmit(event) {
  event.preventDefault();

  const id = bankIdElement.value.trim();
  const payload = normalizeBankInput(bankNameElement.value, bankCountryElement.value);

  try {
    if (id) {
      await apiRequest(`/api/banks/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setBankMessage("Bank updated", false);
    } else {
      await apiRequest("/api/banks", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setBankMessage("Bank created", false);
    }

    resetBankForm();
    await loadBanks();
  } catch (error) {
    setBankMessage(error.message, true);
  }
}

async function onBankAccountFormSubmit(event) {
  event.preventDefault();

  const id = bankAccountIdElement.value.trim();
  const payload = normalizeBankAccountInput(
    bankAccountBankIdElement.value,
    bankAccountCurrencyIdElement.value,
    bankAccountNumberElement.value,
    bankAccountBalanceElement.value
  );

  try {
    if (id) {
      await apiRequest(`/api/bank-accounts/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setBankAccountMessage("Bank account updated", false);
    } else {
      await apiRequest("/api/bank-accounts", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setBankAccountMessage("Bank account created", false);
    }

    resetBankAccountForm();
    await loadBankAccounts();
  } catch (error) {
    setBankAccountMessage(error.message, true);
  }
}

function onRowAction(event) {
  const action = event.target.getAttribute("data-action");
  const id = event.target.getAttribute("data-id");
  if (!id) {
    return;
  }

  const currency = currencies.find((item) => String(item.id) === id);
  if (!currency) {
    return;
  }

  if (action === "edit") {
    currencyIdElement.value = String(currency.id);
    currencyNameElement.value = currency.name;
    currencyCodeElement.value = currency.code;
    submitButtonElement.textContent = "Update";
    cancelButtonElement.hidden = false;
    setMessage(`Editing currency #${currency.id}`, false);
    return;
  }

  if (action === "delete") {
    deleteCurrency(currency.id);
  }
}

function onBankRowAction(event) {
  const action = event.target.getAttribute("data-action");
  const id = event.target.getAttribute("data-id");
  if (!id) {
    return;
  }

  const bank = banks.find((item) => String(item.id) === id);
  if (!bank) {
    return;
  }

  if (action === "edit") {
    bankIdElement.value = String(bank.id);
    bankNameElement.value = bank.name;
    bankCountryElement.value = bank.country;
    bankSubmitButtonElement.textContent = "Update";
    bankCancelButtonElement.hidden = false;
    setBankMessage(`Editing bank #${bank.id}`, false);
    return;
  }

  if (action === "delete") {
    deleteBank(bank.id);
  }
}

function onBankAccountRowAction(event) {
  const action = event.target.getAttribute("data-action");
  const id = event.target.getAttribute("data-id");
  if (!id) {
    return;
  }

  const bankAccount = bankAccounts.find((item) => String(item.id) === id);
  if (!bankAccount) {
    return;
  }

  if (action === "edit") {
    bankAccountIdElement.value = String(bankAccount.id);
    bankAccountBankIdElement.value = String(bankAccount.bank_id);
    bankAccountCurrencyIdElement.value = String(bankAccount.currency_id);
    bankAccountNumberElement.value = bankAccount.account_number;
    bankAccountBalanceElement.value = String(bankAccount.balance);
    bankAccountSubmitButtonElement.textContent = "Update";
    bankAccountCancelButtonElement.hidden = false;
    setBankAccountMessage(`Editing bank account #${bankAccount.id}`, false);
    return;
  }

  if (action === "delete") {
    deleteBankAccount(bankAccount.id);
  }
}

async function deleteCurrency(id) {
  try {
    await apiRequest(`/api/currencies/${id}`, { method: "DELETE" });
    setMessage("Currency deleted", false);
    resetForm();
    await loadCurrencies();
  } catch (error) {
    setMessage(error.message, true);
  }
}

async function deleteBank(id) {
  try {
    await apiRequest(`/api/banks/${id}`, { method: "DELETE" });
    setBankMessage("Bank deleted", false);
    resetBankForm();
    await loadBanks();
  } catch (error) {
    setBankMessage(error.message, true);
  }
}

async function deleteBankAccount(id) {
  try {
    await apiRequest(`/api/bank-accounts/${id}`, { method: "DELETE" });
    setBankAccountMessage("Bank account deleted", false);
    resetBankAccountForm();
    await loadBankAccounts();
  } catch (error) {
    setBankAccountMessage(error.message, true);
  }
}

function resetForm() {
  formElement.reset();
  currencyIdElement.value = "";
  submitButtonElement.textContent = "Create";
  cancelButtonElement.hidden = true;
}

function resetBankForm() {
  bankFormElement.reset();
  bankIdElement.value = "";
  bankSubmitButtonElement.textContent = "Create";
  bankCancelButtonElement.hidden = true;
}

function resetBankAccountForm() {
  bankAccountFormElement.reset();
  bankAccountIdElement.value = "";
  bankAccountSubmitButtonElement.textContent = "Create";
  bankAccountCancelButtonElement.hidden = true;
}

function setMessage(message, isError) {
  messageElement.textContent = message;
  messageElement.className = isError ? "error" : "success";
}

function setBankMessage(message, isError) {
  bankMessageElement.textContent = message;
  bankMessageElement.className = isError ? "error" : "success";
}

function setBankAccountMessage(message, isError) {
  bankAccountMessageElement.textContent = message;
  bankAccountMessageElement.className = isError ? "error" : "success";
}

async function apiRequest(url, options) {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  if (response.status === 204) {
    return null;
  }

  return parseApiResponse(response);
}

function populateBankCountryOptions(countries) {
  const orderedCountries = [...countries].sort((left, right) => left.code.localeCompare(right.code));

  for (const country of orderedCountries) {
    const option = document.createElement("option");
    option.value = country.code;
    option.textContent = `${country.code} - ${country.name}`;
    bankCountryElement.appendChild(option);
  }
}

function populateBankAccountBankOptions() {
  bankAccountBankIdElement.innerHTML = "";

  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Select bank";
  bankAccountBankIdElement.appendChild(defaultOption);

  for (const bank of banks) {
    const option = document.createElement("option");
    option.value = String(bank.id);
    option.textContent = `${bank.name} (${bank.country})`;
    bankAccountBankIdElement.appendChild(option);
  }
}

function populateBankAccountCurrencyOptions() {
  bankAccountCurrencyIdElement.innerHTML = "";

  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Select currency";
  bankAccountCurrencyIdElement.appendChild(defaultOption);

  for (const currency of currencies) {
    const option = document.createElement("option");
    option.value = String(currency.id);
    option.textContent = `${currency.code} - ${currency.name}`;
    bankAccountCurrencyIdElement.appendChild(option);
  }
}

function formatBankLabel(bankID) {
  const bank = banks.find((item) => item.id === bankID);
  if (!bank) {
    return `#${bankID}`;
  }

  return `${bank.name} (${bank.country})`;
}

function formatCurrencyLabel(currencyID) {
  const currency = currencies.find((item) => item.id === currencyID);
  if (!currency) {
    return `#${currencyID}`;
  }

  return `${currency.code} - ${currency.name}`;
}