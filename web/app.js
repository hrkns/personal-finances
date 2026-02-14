const healthStatusElement = document.getElementById("health-status");
const formElement = document.getElementById("currency-form");
const currencyIdElement = document.getElementById("currency-id");
const currencyNameElement = document.getElementById("currency-name");
const currencyCodeElement = document.getElementById("currency-code");
const submitButtonElement = document.getElementById("submit-button");
const cancelButtonElement = document.getElementById("cancel-button");
const messageElement = document.getElementById("form-message");
const currenciesBodyElement = document.getElementById("currencies-body");
const { normalizeCurrencyInput, escapeHtml, parseApiResponse } = frontendUtils;

let currencies = [];

init();

async function init() {
  await Promise.all([loadHealth(), loadCurrencies()]);

  formElement.addEventListener("submit", onFormSubmit);
  cancelButtonElement.addEventListener("click", resetForm);
}

async function loadHealth() {
  try {
    const health = await apiRequest("/api/health", { method: "GET" });
    healthStatusElement.textContent = `Backend status: ${health.message}`;
  } catch {
    healthStatusElement.textContent = "Backend status: unavailable";
  }
}

async function loadCurrencies() {
  try {
    currencies = await apiRequest("/api/currencies", { method: "GET" });
    renderCurrencies();
  } catch (error) {
    setMessage(error.message, true);
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

function resetForm() {
  formElement.reset();
  currencyIdElement.value = "";
  submitButtonElement.textContent = "Create";
  cancelButtonElement.hidden = true;
}

function setMessage(message, isError) {
  messageElement.textContent = message;
  messageElement.className = isError ? "error" : "success";
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