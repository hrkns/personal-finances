/**
 * In-memory application state container.
 *
 * Analogy:
 * - React: similar to colocated `useState` slices lifted to app scope.
 * - Redux/NgRx/Pinia/Vuex: a minimal store-like object with explicit getters/setters,
 *   but without reducers, actions, or reactivity runtime.
 */
(function initAppState(globalScope) {
  /**
   * Creates state slices for each domain aggregate used in the UI.
   *
   * @returns {{
   *   getCurrencies: () => any[], setCurrencies: (items: any[]) => void,
   *   getBanks: () => any[], setBanks: (items: any[]) => void,
   *   getPeople: () => any[], setPeople: (items: any[]) => void,
   *   getTransactionCategories: () => any[], setTransactionCategories: (items: any[]) => void,
   *   getBankAccounts: () => any[], setBankAccounts: (items: any[]) => void,
   *   getCreditCards: () => any[], setCreditCards: (items: any[]) => void,
   *   getCreditCardInstallments: () => any[], setCreditCardInstallments: (items: any[]) => void,
  *   getCreditCardSubscriptions: () => any[], setCreditCardSubscriptions: (items: any[]) => void,
   *   getCreditCardCycles: () => any[], setCreditCardCycles: (items: any[]) => void,
   *   getCreditCardCycleBalances: () => any[], setCreditCardCycleBalances: (items: any[]) => void,
   *   getTransactions: () => any[], setTransactions: (items: any[]) => void
   * }}
   */
  function createAppState() {
    let currencies = [];
    let banks = [];
    let people = [];
    let transactionCategories = [];
    let bankAccounts = [];
    let creditCards = [];
    let creditCardInstallments = [];
    let creditCardSubscriptions = [];
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
      getCreditCardInstallments: () => creditCardInstallments,
      setCreditCardInstallments: (items) => {
        creditCardInstallments = items;
      },
      getCreditCardSubscriptions: () => creditCardSubscriptions,
      setCreditCardSubscriptions: (items) => {
        creditCardSubscriptions = items;
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
