/**
 * Feature-module composition root.
 *
 * Analogy:
 * - React: similar to dependency injection through props/context into feature hooks.
 * - Angular: similar to wiring services and child feature components in a parent module.
 * - Vue: similar to assembling multiple composables and exposing their APIs.
 */
(function initAppModules(globalScope) {
  /**
   * Instantiates all feature modules and their cross-module callbacks.
   *
   * @param {{
   *   dom: object,
   *   state: object,
   *   apiRequest: (url: string, options?: RequestInit) => Promise<any>,
   *   frontendUtils: object
   * }} config Shared dependencies for every feature module.
   * @returns {{
   *   transactionCategoriesModule: object,
   *   transactionsModule: object,
   *   peopleModule: object,
   *   currenciesModule: object,
   *   banksModule: object,
   *   bankAccountsModule: object,
   *   creditCardsModule: object,
   *   creditCardInstallmentsModule: object,
   *   creditCardSubscriptionsModule: object,
   *   creditCardCyclesModule: object
   * }}
   */
  function createAppModules(config) {
    const {
      createBankAccountsModule,
      createCreditCardsModule,
      createCreditCardInstallmentsModule,
      createCreditCardCyclesModule,
      createCreditCardSubscriptionsModule,
      createCurrenciesModule,
      createBanksModule,
      createPeopleModule,
      createTransactionCategoriesModule,
      createTransactionsModule,
    } = globalScope;

    const moduleFactories = {
      createBankAccountsModule,
      createCreditCardsModule,
      createCreditCardInstallmentsModule,
      createCreditCardCyclesModule,
      createCreditCardSubscriptionsModule,
      createCurrenciesModule,
      createBanksModule,
      createPeopleModule,
      createTransactionCategoriesModule,
      createTransactionsModule,
    };

    Object.keys(moduleFactories).forEach((name) => {
      const factory = moduleFactories[name];
      if (typeof factory !== "function") {
        throw new Error(`Missing or invalid module factory on global scope: ${name} (expected function, got ${String(factory)})`);
      }
    });

    const {
      dom,
      state,
      apiRequest,
      frontendUtils,
    } = config;

    const {
      normalizeCurrencyInput,
      normalizeBankInput,
      normalizePersonInput,
      normalizeTransactionCategoryInput,
      normalizeTransactionInput,
      normalizeBankAccountInput,
      normalizeCreditCardInput,
      normalizeCreditCardInstallmentInput,
      normalizeCreditCardSubscriptionInput,
      normalizeCreditCardCycleInput,
      normalizeCreditCardCycleBalanceInput,
      escapeHtml,
    } = frontendUtils;

    let transactionsModule = null;
    let creditCardCyclesModule = null;
    let creditCardInstallmentsModule = null;
    let creditCardSubscriptionsModule = null;

    const bankAccountsModule = createBankAccountsModule({
      elements: dom.bankAccounts,
      apiRequest,
      normalizeBankAccountInput,
      escapeHtml,
      getBanks: state.getBanks,
      getCurrencies: state.getCurrencies,
      getBankAccounts: state.getBankAccounts,
      setBankAccounts: state.setBankAccounts,
      onBankAccountsChanged: () => {
        if (transactionsModule) {
          transactionsModule.populateBankAccountOptions();
          transactionsModule.render();
        }
      },
    });

    const creditCardsModule = createCreditCardsModule({
      elements: dom.creditCards,
      apiRequest,
      normalizeCreditCardInput,
      escapeHtml,
      getBanks: state.getBanks,
      getPeople: state.getPeople,
      getCreditCards: state.getCreditCards,
      setCreditCards: state.setCreditCards,
      onCreditCardsChanged: async () => {
        if (creditCardCyclesModule) {
          await creditCardCyclesModule.load();
        }
        if (creditCardInstallmentsModule) {
          await creditCardInstallmentsModule.load();
        }
        if (creditCardSubscriptionsModule) {
          await creditCardSubscriptionsModule.load();
        }
      },
    });

    creditCardInstallmentsModule = createCreditCardInstallmentsModule({
      elements: dom.creditCardInstallments,
      apiRequest,
      normalizeCreditCardInstallmentInput,
      escapeHtml,
      getCreditCards: state.getCreditCards,
      getCurrencies: state.getCurrencies,
      getCreditCardInstallments: state.getCreditCardInstallments,
      setCreditCardInstallments: state.setCreditCardInstallments,
    });

    creditCardCyclesModule = createCreditCardCyclesModule({
      elements: dom.creditCardCycles,
      balanceElements: dom.creditCardCycleBalances,
      apiRequest,
      normalizeCreditCardCycleInput,
      normalizeCreditCardCycleBalanceInput,
      escapeHtml,
      getCreditCards: state.getCreditCards,
      getCurrencies: state.getCurrencies,
      getCreditCardCycles: state.getCreditCardCycles,
      setCreditCardCycles: state.setCreditCardCycles,
      getCreditCardCycleBalances: state.getCreditCardCycleBalances,
      setCreditCardCycleBalances: state.setCreditCardCycleBalances,
    });

    creditCardSubscriptionsModule = createCreditCardSubscriptionsModule({
      elements: dom.creditCardSubscriptions,
      apiRequest,
      normalizeCreditCardSubscriptionInput,
      escapeHtml,
      getCreditCards: state.getCreditCards,
      getCurrencies: state.getCurrencies,
      getCreditCardSubscriptions: state.getCreditCardSubscriptions,
      setCreditCardSubscriptions: state.setCreditCardSubscriptions,
    });

    const currenciesModule = createCurrenciesModule({
      elements: dom.currency,
      apiRequest,
      normalizeCurrencyInput,
      escapeHtml,
      getCurrencies: state.getCurrencies,
      setCurrencies: state.setCurrencies,
      onCurrenciesChanged: () => {
        bankAccountsModule.populateCurrencyOptions();
        bankAccountsModule.render();
        creditCardInstallmentsModule.populateCurrencyOptions();
        creditCardInstallmentsModule.render();
        creditCardSubscriptionsModule.populateCurrencyOptions();
        creditCardSubscriptionsModule.render();
        creditCardCyclesModule.populateBalanceCurrencyOptions();
        creditCardCyclesModule.renderBalances();
        if (transactionsModule) {
          transactionsModule.populateBankAccountOptions();
          transactionsModule.render();
        }
      },
    });

    const banksModule = createBanksModule({
      elements: dom.bank,
      apiRequest,
      normalizeBankInput,
      escapeHtml,
      getBanks: state.getBanks,
      setBanks: state.setBanks,
      onBanksChanged: () => {
        bankAccountsModule.populateBankOptions();
        bankAccountsModule.render();
        creditCardsModule.populateBankOptions();
        creditCardsModule.render();
        if (transactionsModule) {
          transactionsModule.populateBankAccountOptions();
          transactionsModule.render();
        }
      },
    });

    const peopleModule = createPeopleModule({
      elements: dom.people,
      apiRequest,
      normalizePersonInput,
      escapeHtml,
      getPeople: state.getPeople,
      setPeople: state.setPeople,
      onPeopleChanged: () => {
        creditCardsModule.populatePersonOptions();
        creditCardsModule.render();
        if (transactionsModule) {
          transactionsModule.populatePersonOptions();
          transactionsModule.render();
        }
      },
    });

    const transactionCategoriesModule = createTransactionCategoriesModule({
      elements: dom.transactionCategories,
      apiRequest,
      normalizeTransactionCategoryInput,
      escapeHtml,
      getTransactionCategories: state.getTransactionCategories,
      setTransactionCategories: state.setTransactionCategories,
      onTransactionCategoriesChanged: () => {
        if (transactionsModule) {
          transactionsModule.populateCategoryOptions();
          transactionsModule.render();
        }
      },
    });

    transactionsModule = createTransactionsModule({
      elements: dom.transactions,
      apiRequest,
      normalizeTransactionInput,
      escapeHtml,
      getPeople: state.getPeople,
      getBanks: state.getBanks,
      getCurrencies: state.getCurrencies,
      getBankAccounts: state.getBankAccounts,
      getTransactionCategories: state.getTransactionCategories,
      getTransactions: state.getTransactions,
      setTransactions: state.setTransactions,
    });

    return {
      transactionCategoriesModule,
      transactionsModule,
      peopleModule,
      currenciesModule,
      banksModule,
      bankAccountsModule,
      creditCardsModule,
      creditCardInstallmentsModule,
      creditCardSubscriptionsModule,
      creditCardCyclesModule,
    };
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { createAppModules };
    return;
  }

  globalScope.createAppModules = createAppModules;
})(typeof globalThis !== "undefined" ? globalThis : window);
