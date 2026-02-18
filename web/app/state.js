(function initAppState(globalScope) {
  function createAppState() {
    let currencies = [];
    let banks = [];
    let people = [];
    let transactionCategories = [];
    let bankAccounts = [];
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
