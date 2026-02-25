(function initAppState(globalScope) {
  function createAppState() {
    let currencies = [];
    let banks = [];
    let people = [];
    let transactionCategories = [];
    let bankAccounts = [];
    let creditCards = [];
    let creditCardCycles = [];
    let creditCardCycleBalances = [];
    let transactions = [];

    return {
      getCurrencies: () => currencies,
      setCurrencies: (items) => {
        currencies = items;
      },
      getBanks: () => banks,
      setBanks: (items) => {
        banks = items;
      },
      getPeople: () => people,
      setPeople: (items) => {
        people = items;
      },
      getTransactionCategories: () => transactionCategories,
      setTransactionCategories: (items) => {
        transactionCategories = items;
      },
      getBankAccounts: () => bankAccounts,
      setBankAccounts: (items) => {
        bankAccounts = items;
      },
      getCreditCards: () => creditCards,
      setCreditCards: (items) => {
        creditCards = items;
      },
      getCreditCardCycles: () => creditCardCycles,
      setCreditCardCycles: (items) => {
        creditCardCycles = items;
      },
      getCreditCardCycleBalances: () => creditCardCycleBalances,
      setCreditCardCycleBalances: (items) => {
        creditCardCycleBalances = items;
      },
      getTransactions: () => transactions,
      setTransactions: (items) => {
        transactions = items;
      },
    };
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { createAppState };
    return;
  }

  globalScope.createAppState = createAppState;
})(typeof globalThis !== "undefined" ? globalThis : window);
