const healthStatusElement = document.getElementById("health-status");
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

const { normalizeCurrencyInput, normalizeBankInput, escapeHtml, parseApiResponse } = frontendUtils;

const bankCountryOptions = {
  AD: "Andorra", AE: "United Arab Emirates", AF: "Afghanistan", AG: "Antigua and Barbuda", AI: "Anguilla", AL: "Albania", AM: "Armenia", AO: "Angola", AQ: "Antarctica", AR: "Argentina", AS: "American Samoa", AT: "Austria", AU: "Australia", AW: "Aruba", AX: "Åland Islands", AZ: "Azerbaijan",
  BA: "Bosnia and Herzegovina", BB: "Barbados", BD: "Bangladesh", BE: "Belgium", BF: "Burkina Faso", BG: "Bulgaria", BH: "Bahrain", BI: "Burundi", BJ: "Benin", BL: "Saint Barthélemy", BM: "Bermuda", BN: "Brunei Darussalam", BO: "Bolivia", BQ: "Bonaire, Sint Eustatius and Saba", BR: "Brazil", BS: "Bahamas", BT: "Bhutan", BV: "Bouvet Island", BW: "Botswana", BY: "Belarus", BZ: "Belize",
  CA: "Canada", CC: "Cocos (Keeling) Islands", CD: "Congo, Democratic Republic of the", CF: "Central African Republic", CG: "Congo", CH: "Switzerland", CI: "Côte d'Ivoire", CK: "Cook Islands", CL: "Chile", CM: "Cameroon", CN: "China", CO: "Colombia", CR: "Costa Rica", CU: "Cuba", CV: "Cabo Verde", CW: "Curaçao", CX: "Christmas Island", CY: "Cyprus", CZ: "Czechia",
  DE: "Germany", DJ: "Djibouti", DK: "Denmark", DM: "Dominica", DO: "Dominican Republic", DZ: "Algeria",
  EC: "Ecuador", EE: "Estonia", EG: "Egypt", EH: "Western Sahara", ER: "Eritrea", ES: "Spain", ET: "Ethiopia",
  FI: "Finland", FJ: "Fiji", FK: "Falkland Islands", FM: "Micronesia", FO: "Faroe Islands", FR: "France",
  GA: "Gabon", GB: "United Kingdom", GD: "Grenada", GE: "Georgia", GF: "French Guiana", GG: "Guernsey", GH: "Ghana", GI: "Gibraltar", GL: "Greenland", GM: "Gambia", GN: "Guinea", GP: "Guadeloupe", GQ: "Equatorial Guinea", GR: "Greece", GS: "South Georgia and the South Sandwich Islands", GT: "Guatemala", GU: "Guam", GW: "Guinea-Bissau", GY: "Guyana",
  HK: "Hong Kong", HM: "Heard Island and McDonald Islands", HN: "Honduras", HR: "Croatia", HT: "Haiti", HU: "Hungary",
  ID: "Indonesia", IE: "Ireland", IL: "Israel", IM: "Isle of Man", IN: "India", IO: "British Indian Ocean Territory", IQ: "Iraq", IR: "Iran", IS: "Iceland", IT: "Italy",
  JE: "Jersey", JM: "Jamaica", JO: "Jordan", JP: "Japan",
  KE: "Kenya", KG: "Kyrgyzstan", KH: "Cambodia", KI: "Kiribati", KM: "Comoros", KN: "Saint Kitts and Nevis", KP: "Korea (Democratic People's Republic of)", KR: "Korea, Republic of", KW: "Kuwait", KY: "Cayman Islands", KZ: "Kazakhstan",
  LA: "Lao People's Democratic Republic", LB: "Lebanon", LC: "Saint Lucia", LI: "Liechtenstein", LK: "Sri Lanka", LR: "Liberia", LS: "Lesotho", LT: "Lithuania", LU: "Luxembourg", LV: "Latvia", LY: "Libya",
  MA: "Morocco", MC: "Monaco", MD: "Moldova", ME: "Montenegro", MF: "Saint Martin (French part)", MG: "Madagascar", MH: "Marshall Islands", MK: "North Macedonia", ML: "Mali", MM: "Myanmar", MN: "Mongolia", MO: "Macao", MP: "Northern Mariana Islands", MQ: "Martinique", MR: "Mauritania", MS: "Montserrat", MT: "Malta", MU: "Mauritius", MV: "Maldives", MW: "Malawi", MX: "Mexico", MY: "Malaysia", MZ: "Mozambique",
  NA: "Namibia", NC: "New Caledonia", NE: "Niger", NF: "Norfolk Island", NG: "Nigeria", NI: "Nicaragua", NL: "Netherlands", NO: "Norway", NP: "Nepal", NR: "Nauru", NU: "Niue", NZ: "New Zealand",
  OM: "Oman",
  PA: "Panama", PE: "Peru", PF: "French Polynesia", PG: "Papua New Guinea", PH: "Philippines", PK: "Pakistan", PL: "Poland", PM: "Saint Pierre and Miquelon", PN: "Pitcairn", PR: "Puerto Rico", PS: "Palestine, State of", PT: "Portugal", PW: "Palau", PY: "Paraguay",
  QA: "Qatar",
  RE: "Réunion", RO: "Romania", RS: "Serbia", RU: "Russian Federation", RW: "Rwanda",
  SA: "Saudi Arabia", SB: "Solomon Islands", SC: "Seychelles", SD: "Sudan", SE: "Sweden", SG: "Singapore", SH: "Saint Helena, Ascension and Tristan da Cunha", SI: "Slovenia", SJ: "Svalbard and Jan Mayen", SK: "Slovakia", SL: "Sierra Leone", SM: "San Marino", SN: "Senegal", SO: "Somalia", SR: "Suriname", SS: "South Sudan", ST: "Sao Tome and Principe", SV: "El Salvador", SX: "Sint Maarten (Dutch part)", SY: "Syrian Arab Republic", SZ: "Eswatini",
  TC: "Turks and Caicos Islands", TD: "Chad", TF: "French Southern Territories", TG: "Togo", TH: "Thailand", TJ: "Tajikistan", TK: "Tokelau", TL: "Timor-Leste", TM: "Turkmenistan", TN: "Tunisia", TO: "Tonga", TR: "Türkiye", TT: "Trinidad and Tobago", TV: "Tuvalu", TW: "Taiwan, Province of China", TZ: "Tanzania",
  UA: "Ukraine", UG: "Uganda", UM: "United States Minor Outlying Islands", US: "United States", UY: "Uruguay", UZ: "Uzbekistan",
  VA: "Holy See", VC: "Saint Vincent and the Grenadines", VE: "Venezuela", VG: "Virgin Islands (British)", VI: "Virgin Islands (U.S.)", VN: "Viet Nam", VU: "Vanuatu",
  WF: "Wallis and Futuna", WS: "Samoa",
  YE: "Yemen", YT: "Mayotte",
  ZA: "South Africa", ZM: "Zambia", ZW: "Zimbabwe",
};

let currencies = [];
let banks = [];

init();

async function init() {
  populateBankCountryOptions();
  await Promise.all([loadHealth(), loadCurrencies(), loadBanks()]);

  formElement.addEventListener("submit", onFormSubmit);
  cancelButtonElement.addEventListener("click", resetForm);
  bankFormElement.addEventListener("submit", onBankFormSubmit);
  bankCancelButtonElement.addEventListener("click", resetBankForm);
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

function populateBankCountryOptions() {
  for (const [code, name] of Object.entries(bankCountryOptions)) {
    const option = document.createElement("option");
    option.value = code;
    option.textContent = `${code} - ${name}`;
    bankCountryElement.appendChild(option);
  }
}