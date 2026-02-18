(function initAppDom(globalScope) {
  function createAppDom(documentRef) {
    return {
      currency: {
        formElement: documentRef.getElementById("currency-form"),
        idElement: documentRef.getElementById("currency-id"),
        nameElement: documentRef.getElementById("currency-name"),
        codeElement: documentRef.getElementById("currency-code"),
        submitButtonElement: documentRef.getElementById("submit-button"),
        cancelButtonElement: documentRef.getElementById("cancel-button"),
        messageElement: documentRef.getElementById("form-message"),
        bodyElement: documentRef.getElementById("currencies-body"),
      },
      bank: {
        formElement: documentRef.getElementById("bank-form"),
        idElement: documentRef.getElementById("bank-id"),
        nameElement: documentRef.getElementById("bank-name"),
        countryElement: documentRef.getElementById("bank-country"),
        submitButtonElement: documentRef.getElementById("bank-submit-button"),
        cancelButtonElement: documentRef.getElementById("bank-cancel-button"),
        messageElement: documentRef.getElementById("bank-form-message"),
        bodyElement: documentRef.getElementById("banks-body"),
      },
      people: {
        formElement: documentRef.getElementById("people-form"),
        idElement: documentRef.getElementById("person-id"),
        nameElement: documentRef.getElementById("person-name"),
        submitButtonElement: documentRef.getElementById("person-submit-button"),
        cancelButtonElement: documentRef.getElementById("person-cancel-button"),
        messageElement: documentRef.getElementById("person-form-message"),
        bodyElement: documentRef.getElementById("people-body"),
      },
      transactionCategories: {
        formElement: documentRef.getElementById("transaction-category-form"),
        idElement: documentRef.getElementById("transaction-category-id"),
        nameElement: documentRef.getElementById("transaction-category-name"),
        parentIdElement: documentRef.getElementById("transaction-category-parent-id"),
        submitButtonElement: documentRef.getElementById("transaction-category-submit-button"),
        cancelButtonElement: documentRef.getElementById("transaction-category-cancel-button"),
        messageElement: documentRef.getElementById("transaction-category-form-message"),
        bodyElement: documentRef.getElementById("transaction-categories-body"),
      },
      transactions: {
        formElement: documentRef.getElementById("transaction-form"),
        idElement: documentRef.getElementById("transaction-id"),
        dateElement: documentRef.getElementById("transaction-date"),
        typeElement: documentRef.getElementById("transaction-type"),
        amountElement: documentRef.getElementById("transaction-amount"),
        notesElement: documentRef.getElementById("transaction-notes"),
        personIdElement: documentRef.getElementById("transaction-person-id"),
        bankAccountIdElement: documentRef.getElementById("transaction-bank-account-id"),
        categoryIdElement: documentRef.getElementById("transaction-category-id-input"),
        submitButtonElement: documentRef.getElementById("transaction-submit-button"),
        cancelButtonElement: documentRef.getElementById("transaction-cancel-button"),
        messageElement: documentRef.getElementById("transaction-form-message"),
        bodyElement: documentRef.getElementById("transactions-body"),
      },
      bankAccounts: {
        formElement: documentRef.getElementById("bank-account-form"),
        idElement: documentRef.getElementById("bank-account-id"),
        bankIdElement: documentRef.getElementById("bank-account-bank-id"),
        currencyIdElement: documentRef.getElementById("bank-account-currency-id"),
        accountNumberElement: documentRef.getElementById("bank-account-number"),
        balanceElement: documentRef.getElementById("bank-account-balance"),
        submitButtonElement: documentRef.getElementById("bank-account-submit-button"),
        cancelButtonElement: documentRef.getElementById("bank-account-cancel-button"),
        messageElement: documentRef.getElementById("bank-account-form-message"),
        bodyElement: documentRef.getElementById("bank-accounts-body"),
      },
      settingsSelectionMessageElement: documentRef.getElementById("settings-selection-message"),
      tabButtonElements: documentRef.querySelectorAll("[data-route-tab]"),
      settingsTabButtonElements: documentRef.querySelectorAll("[data-settings-tab]"),
      views: {
        home: documentRef.getElementById("view-home"),
        transactions: documentRef.getElementById("view-transactions"),
        settings: documentRef.getElementById("view-settings"),
      },
      settingsViews: {
        transactionCategories: documentRef.getElementById("view-transaction-categories"),
        people: documentRef.getElementById("view-people"),
        bankAccounts: documentRef.getElementById("view-bank-accounts"),
        banks: documentRef.getElementById("view-banks"),
        currency: documentRef.getElementById("view-currency"),
      },
    };
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { createAppDom };
    return;
  }

  globalScope.createAppDom = createAppDom;
})(typeof globalThis !== "undefined" ? globalThis : window);
