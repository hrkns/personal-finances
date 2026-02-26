/**
 * DOM registry factory.
 *
 * Analogy:
 * - React: similar to collecting stable `ref` handles in one place.
 * - Angular: similar to grouping `@ViewChild` references by feature section.
 * - Vue: similar to a centralized map of template refs consumed by composables.
 */
(function initAppDom(globalScope) {
  /**
   * Builds and returns all DOM references used by feature modules.
   *
   * The returned object acts as a single source of truth for element lookups,
   * avoiding repeated queries and making module contracts explicit.
   *
   * @param {Document} documentRef Browser document reference.
   * @returns {{
   *   currency: object,
   *   bank: object,
   *   people: object,
   *   transactionCategories: object,
   *   transactions: object,
   *   bankAccounts: object,
   *   creditCards: object,
   *   creditCardCycles: object,
   *   creditCardInstallments: object,
  *   creditCardSubscriptions: object,
   *   creditCardCycleBalances: object,
   *   settingsSelectionMessageElement: HTMLElement,
   *   tabButtonElements: NodeListOf<Element>,
   *   settingsTabButtonElements: NodeListOf<Element>,
   *   creditCardTabButtonElements: NodeListOf<Element>,
   *   views: object,
   *   creditCardViews: object,
   *   settingsViews: object
   * }}
   */
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
      creditCards: {
        formElement: documentRef.getElementById("credit-card-form"),
        idElement: documentRef.getElementById("credit-card-id"),
        bankIdElement: documentRef.getElementById("credit-card-bank-id"),
        personIdElement: documentRef.getElementById("credit-card-person-id"),
        numberElement: documentRef.getElementById("credit-card-number"),
        nameElement: documentRef.getElementById("credit-card-name"),
        submitButtonElement: documentRef.getElementById("credit-card-submit-button"),
        cancelButtonElement: documentRef.getElementById("credit-card-cancel-button"),
        messageElement: documentRef.getElementById("credit-card-form-message"),
        bodyElement: documentRef.getElementById("credit-cards-body"),
      },
      creditCardCycles: {
        formElement: documentRef.getElementById("credit-card-cycle-form"),
        idElement: documentRef.getElementById("credit-card-cycle-id"),
        creditCardIdElement: documentRef.getElementById("credit-card-cycle-credit-card-id"),
        closingDateElement: documentRef.getElementById("credit-card-cycle-closing-date"),
        dueDateElement: documentRef.getElementById("credit-card-cycle-due-date"),
        submitButtonElement: documentRef.getElementById("credit-card-cycle-submit-button"),
        cancelButtonElement: documentRef.getElementById("credit-card-cycle-cancel-button"),
        messageElement: documentRef.getElementById("credit-card-cycle-form-message"),
        bodyElement: documentRef.getElementById("credit-card-cycles-body"),
      },
      creditCardInstallments: {
        formElement: documentRef.getElementById("credit-card-installment-form"),
        idElement: documentRef.getElementById("credit-card-installment-id"),
        creditCardIdElement: documentRef.getElementById("credit-card-installment-credit-card-id"),
        currencyIdElement: documentRef.getElementById("credit-card-installment-currency-id"),
        conceptElement: documentRef.getElementById("credit-card-installment-concept"),
        amountElement: documentRef.getElementById("credit-card-installment-amount"),
        startDateElement: documentRef.getElementById("credit-card-installment-start-date"),
        countElement: documentRef.getElementById("credit-card-installment-count"),
        submitButtonElement: documentRef.getElementById("credit-card-installment-submit-button"),
        cancelButtonElement: documentRef.getElementById("credit-card-installment-cancel-button"),
        messageElement: documentRef.getElementById("credit-card-installment-form-message"),
        bodyElement: documentRef.getElementById("credit-card-installments-body"),
      },
      creditCardSubscriptions: {
        formElement: documentRef.getElementById("credit-card-subscription-form"),
        idElement: documentRef.getElementById("credit-card-subscription-id"),
        creditCardIdElement: documentRef.getElementById("credit-card-subscription-credit-card-id"),
        currencyIdElement: documentRef.getElementById("credit-card-subscription-currency-id"),
        conceptElement: documentRef.getElementById("credit-card-subscription-concept"),
        amountElement: documentRef.getElementById("credit-card-subscription-amount"),
        submitButtonElement: documentRef.getElementById("credit-card-subscription-submit-button"),
        cancelButtonElement: documentRef.getElementById("credit-card-subscription-cancel-button"),
        messageElement: documentRef.getElementById("credit-card-subscription-form-message"),
        bodyElement: documentRef.getElementById("credit-card-subscriptions-body"),
      },
      creditCardCycleBalances: {
        sectionElement: documentRef.getElementById("credit-card-cycle-balances-section"),
        selectionMessageElement: documentRef.getElementById("credit-card-cycle-balances-selection-message"),
        formElement: documentRef.getElementById("credit-card-cycle-balance-form"),
        idElement: documentRef.getElementById("credit-card-cycle-balance-id"),
        cycleIdElement: documentRef.getElementById("credit-card-cycle-balance-cycle-id"),
        currencyIdElement: documentRef.getElementById("credit-card-cycle-balance-currency-id"),
        balanceElement: documentRef.getElementById("credit-card-cycle-balance-balance"),
        paidElement: documentRef.getElementById("credit-card-cycle-balance-paid"),
        submitButtonElement: documentRef.getElementById("credit-card-cycle-balance-submit-button"),
        cancelButtonElement: documentRef.getElementById("credit-card-cycle-balance-cancel-button"),
        messageElement: documentRef.getElementById("credit-card-cycle-balance-form-message"),
        bodyElement: documentRef.getElementById("credit-card-cycle-balances-body"),
      },
      settingsSelectionMessageElement: documentRef.getElementById("settings-selection-message"),
      tabButtonElements: documentRef.querySelectorAll("[data-route-tab]"),
      settingsTabButtonElements: documentRef.querySelectorAll("[data-settings-tab]"),
      creditCardTabButtonElements: documentRef.querySelectorAll("[data-credit-card-tab]"),
      views: {
        home: documentRef.getElementById("view-home"),
        transactions: documentRef.getElementById("view-transactions"),
        creditCards: documentRef.getElementById("view-credit-cards"),
        settings: documentRef.getElementById("view-settings"),
      },
      creditCardViews: {
        cards: documentRef.getElementById("view-credit-cards-cards"),
        installments: documentRef.getElementById("view-credit-card-installments"),
        cycles: documentRef.getElementById("view-credit-card-cycles"),
        subscriptions: documentRef.getElementById("view-credit-card-subscriptions"),
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
