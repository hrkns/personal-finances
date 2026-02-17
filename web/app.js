const currencyFormElement = document.getElementById("currency-form");
const currencyIdElement = document.getElementById("currency-id");
const currencyNameElement = document.getElementById("currency-name");
const currencyCodeElement = document.getElementById("currency-code");
const currencySubmitButtonElement = document.getElementById("submit-button");
const currencyCancelButtonElement = document.getElementById("cancel-button");
const currencyMessageElement = document.getElementById("form-message");
const currenciesBodyElement = document.getElementById("currencies-body");

const bankFormElement = document.getElementById("bank-form");
const bankIdElement = document.getElementById("bank-id");
const bankNameElement = document.getElementById("bank-name");
const bankCountryElement = document.getElementById("bank-country");
const bankSubmitButtonElement = document.getElementById("bank-submit-button");
const bankCancelButtonElement = document.getElementById("bank-cancel-button");
const bankMessageElement = document.getElementById("bank-form-message");
const banksBodyElement = document.getElementById("banks-body");

const peopleFormElement = document.getElementById("people-form");
const personIdElement = document.getElementById("person-id");
const personNameElement = document.getElementById("person-name");
const personSubmitButtonElement = document.getElementById("person-submit-button");
const personCancelButtonElement = document.getElementById("person-cancel-button");
const personMessageElement = document.getElementById("person-form-message");
const peopleBodyElement = document.getElementById("people-body");

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
const viewPeopleElement = document.getElementById("view-people");
const viewBankAccountsElement = document.getElementById("view-bank-accounts");
const viewBanksElement = document.getElementById("view-banks");
const viewCurrencyElement = document.getElementById("view-currency");

const { normalizeCurrencyInput, normalizeBankInput, normalizePersonInput, normalizeBankAccountInput, escapeHtml, parseApiResponse } = frontendUtils;

let currencies = [];
let banks = [];
let people = [];
let bankAccounts = [];

const peopleModule = createPeopleModule({
  elements: {
    formElement: peopleFormElement,
    idElement: personIdElement,
    nameElement: personNameElement,
    submitButtonElement: personSubmitButtonElement,
    cancelButtonElement: personCancelButtonElement,
    messageElement: personMessageElement,
    bodyElement: peopleBodyElement,
  },
  apiRequest,
  normalizePersonInput,
  escapeHtml,
  getPeople: () => people,
  setPeople: (items) => {
    people = items;
  },
});

const bankAccountsModule = createBankAccountsModule({
  elements: {
    formElement: bankAccountFormElement,
    idElement: bankAccountIdElement,
    bankIdElement: bankAccountBankIdElement,
    currencyIdElement: bankAccountCurrencyIdElement,
    accountNumberElement: bankAccountNumberElement,
    balanceElement: bankAccountBalanceElement,
    submitButtonElement: bankAccountSubmitButtonElement,
    cancelButtonElement: bankAccountCancelButtonElement,
    messageElement: bankAccountMessageElement,
    bodyElement: bankAccountsBodyElement,
  },
  apiRequest,
  normalizeBankAccountInput,
  escapeHtml,
  getBanks: () => banks,
  getCurrencies: () => currencies,
  getBankAccounts: () => bankAccounts,
  setBankAccounts: (items) => {
    bankAccounts = items;
  },
});

const currenciesModule = createCurrenciesModule({
  elements: {
    formElement: currencyFormElement,
    idElement: currencyIdElement,
    nameElement: currencyNameElement,
    codeElement: currencyCodeElement,
    submitButtonElement: currencySubmitButtonElement,
    cancelButtonElement: currencyCancelButtonElement,
    messageElement: currencyMessageElement,
    bodyElement: currenciesBodyElement,
  },
  apiRequest,
  normalizeCurrencyInput,
  escapeHtml,
  getCurrencies: () => currencies,
  setCurrencies: (items) => {
    currencies = items;
  },
  onCurrenciesChanged: () => {
    bankAccountsModule.populateCurrencyOptions();
    bankAccountsModule.render();
  },
});

const banksModule = createBanksModule({
  elements: {
    formElement: bankFormElement,
    idElement: bankIdElement,
    nameElement: bankNameElement,
    countryElement: bankCountryElement,
    submitButtonElement: bankSubmitButtonElement,
    cancelButtonElement: bankCancelButtonElement,
    messageElement: bankMessageElement,
    bodyElement: banksBodyElement,
  },
  apiRequest,
  normalizeBankInput,
  escapeHtml,
  getBanks: () => banks,
  setBanks: (items) => {
    banks = items;
  },
  onBanksChanged: () => {
    bankAccountsModule.populateBankOptions();
    bankAccountsModule.render();
  },
});

init();

async function init() {
  await banksModule.loadCountryOptions();
  const initialRoute = frontendRouter.ensureValidRoute();
  applyRoute(initialRoute);

  frontendRouter.onRouteChange(applyRoute);

  tabButtonElements.forEach((button) => {
    button.addEventListener("click", () => {
      const route = button.getAttribute("data-route-tab");
      frontendRouter.navigate(route);
    });
  });

  await Promise.all([peopleModule.load(), currenciesModule.load(), banksModule.load(), bankAccountsModule.load()]);

  peopleFormElement.addEventListener("submit", peopleModule.onSubmit);
  personCancelButtonElement.addEventListener("click", peopleModule.resetForm);

  currencyFormElement.addEventListener("submit", currenciesModule.onSubmit);
  currencyCancelButtonElement.addEventListener("click", currenciesModule.resetForm);

  bankFormElement.addEventListener("submit", banksModule.onSubmit);
  bankCancelButtonElement.addEventListener("click", banksModule.resetForm);

  bankAccountFormElement.addEventListener("submit", bankAccountsModule.onSubmit);
  bankAccountCancelButtonElement.addEventListener("click", bankAccountsModule.resetForm);
}

function applyRoute(route) {
  const activeRoute = route || "home";

  viewHomeElement.hidden = activeRoute !== "home";
  viewPeopleElement.hidden = activeRoute !== "people";
  viewBankAccountsElement.hidden = activeRoute !== "bank-accounts";
  viewBanksElement.hidden = activeRoute !== "banks";
  viewCurrencyElement.hidden = activeRoute !== "currency";

  tabButtonElements.forEach((button) => {
    const tabRoute = button.getAttribute("data-route-tab");
    button.classList.toggle("active", tabRoute === activeRoute);
  });
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
