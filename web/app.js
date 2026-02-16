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
const tabButtonElements = document.querySelectorAll("[data-route-tab]");
const viewHomeElement = document.getElementById("view-home");
const viewBanksElement = document.getElementById("view-banks");
const viewCurrencyElement = document.getElementById("view-currency");

const { normalizeCurrencyInput, normalizeBankInput, escapeHtml, parseApiResponse } = frontendUtils;


let currencies = [];
let banks = [];

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

  await Promise.all([loadCurrencies(), loadBanks()]);

  formElement.addEventListener("submit", onFormSubmit);
  cancelButtonElement.addEventListener("click", resetForm);
  bankFormElement.addEventListener("submit", onBankFormSubmit);
  bankCancelButtonElement.addEventListener("click", resetBankForm);
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
  } catch (error) {
    setMessage(error.message, true);
  }
}

async function loadBanks() {
  try {
    banks = await apiRequest("/api/banks", { method: "GET" });
    renderBanks();
  } catch (error) {
    setBankMessage(error.message, true);
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

function setMessage(message, isError) {
  messageElement.textContent = message;
  messageElement.className = isError ? "error" : "success";
}

function setBankMessage(message, isError) {
  bankMessageElement.textContent = message;
  bankMessageElement.className = isError ? "error" : "success";
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