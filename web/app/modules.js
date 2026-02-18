(function initAppModules(globalScope) {
  function createAppModules(config) {
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
      normalizeBankAccountInput,
      escapeHtml,
    } = frontendUtils;

    const bankAccountsModule = createBankAccountsModule({
      elements: dom.bankAccounts,
      apiRequest,
      normalizeBankAccountInput,
      escapeHtml,
      getBanks: state.getBanks,
      getCurrencies: state.getCurrencies,
      getBankAccounts: state.getBankAccounts,
      setBankAccounts: state.setBankAccounts,
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
      },
    });

    const peopleModule = createPeopleModule({
      elements: dom.people,
      apiRequest,
      normalizePersonInput,
      escapeHtml,
      getPeople: state.getPeople,
      setPeople: state.setPeople,
    });

    const transactionCategoriesModule = createTransactionCategoriesModule({
      elements: dom.transactionCategories,
      apiRequest,
      normalizeTransactionCategoryInput,
      escapeHtml,
      getTransactionCategories: state.getTransactionCategories,
      setTransactionCategories: state.setTransactionCategories,
    });

    return {
      transactionCategoriesModule,
      peopleModule,
      currenciesModule,
      banksModule,
      bankAccountsModule,
    };
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { createAppModules };
    return;
  }

  globalScope.createAppModules = createAppModules;
})(typeof globalThis !== "undefined" ? globalThis : window);
