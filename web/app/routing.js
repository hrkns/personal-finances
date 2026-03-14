/**
 * View-routing UI orchestrator.
 *
 * Analogy:
 * - React Router / Vue Router: equivalent to mapping route state to visible components.
 * - Angular Router: similar to activating route outlets and nav link active classes.
 */
(function initAppRouting(globalScope) {
  /**
   * Creates route application/binding helpers for tab-based navigation.
   *
   * @param {{
   *   tabButtonElements: NodeListOf<Element>,
   *   settingsTabButtonElements: NodeListOf<Element>,
  *   transactionTabButtonElements: NodeListOf<Element>,
   *   creditCardTabButtonElements: NodeListOf<Element>,
   *   expenseTabButtonElements: NodeListOf<Element>,
   *   views: object,
   *   settingsViews: object,
  *   transactionViews: object,
   *   creditCardViews: object,
   *   expenseViews: object,
   *   frontendRouter: object
   * }} config DOM and router dependencies.
   * @returns {{applyRoute: (routeState: any) => void, bindTabNavigation: () => void}}
   */
  function createAppRouting(config) {
    const {
      tabButtonElements,
      settingsTabButtonElements,
      transactionTabButtonElements,
      creditCardTabButtonElements,
      expenseTabButtonElements,
      views,
      settingsViews,
      transactionViews,
      creditCardViews,
      expenseViews,
      frontendRouter,
    } = config;

    function normalizeRouteState(routeState) {
      if (typeof routeState === "string") {
        return {
          route: routeState,
          settingsSection: null,
          transactionSection: null,
          creditCardSection: null,
          expenseSection: null,
        };
      }

      return {
        route: routeState?.route || "home",
        settingsSection: routeState?.settingsSection || null,
        transactionSection: routeState?.transactionSection || null,
        creditCardSection: routeState?.creditCardSection || null,
        expenseSection: routeState?.expenseSection || null,
      };
    }

    function applyRoute(routeState) {
      const state = normalizeRouteState(routeState);
      const activeRoute = state.route;
      const activeSettingsSection = state.settingsSection;
      const activeTransactionSection = state.transactionSection;
      const activeCreditCardSection = state.creditCardSection;
      const activeExpenseSection = state.expenseSection;

      views.home.hidden = activeRoute !== "home";
      views.transactions.hidden = activeRoute !== "transactions";
      views.creditCards.hidden = activeRoute !== "credit-cards";
      views.expenses.hidden = activeRoute !== "expenses";
      views.settings.hidden = activeRoute !== "settings";

      settingsViews.people.hidden = activeRoute !== "settings" || activeSettingsSection !== "people";
      settingsViews.bankAccounts.hidden = activeRoute !== "settings" || activeSettingsSection !== "bank-accounts";
      settingsViews.banks.hidden = activeRoute !== "settings" || activeSettingsSection !== "banks";
      settingsViews.currency.hidden = activeRoute !== "settings" || activeSettingsSection !== "currencies";

      transactionViews.list.hidden = activeRoute !== "transactions" || activeTransactionSection !== "list";
      transactionViews.transactionCategories.hidden =
        activeRoute !== "transactions" || activeTransactionSection !== "transaction-categories";

      creditCardViews.cards.hidden = activeRoute !== "credit-cards" || activeCreditCardSection !== "cards";
      creditCardViews.balances.hidden = activeRoute !== "credit-cards" || activeCreditCardSection !== "balances";
      creditCardViews.installments.hidden = activeRoute !== "credit-cards" || activeCreditCardSection !== "installments";
      creditCardViews.cycles.hidden = activeRoute !== "credit-cards" || activeCreditCardSection !== "cycles";
      creditCardViews.subscriptions.hidden = activeRoute !== "credit-cards" || activeCreditCardSection !== "subscriptions";

      expenseViews.expenses.hidden = activeRoute !== "expenses" || activeExpenseSection !== "expenses";
      expenseViews.payments.hidden = activeRoute !== "expenses" || activeExpenseSection !== "payments";

      tabButtonElements.forEach((button) => {
        const tabRoute = button.getAttribute("data-route-tab");
        button.classList.toggle("active", tabRoute === activeRoute);
      });

      settingsTabButtonElements.forEach((button) => {
        const section = button.getAttribute("data-settings-tab");
        button.classList.toggle("active", activeRoute === "settings" && section === activeSettingsSection);
      });

      transactionTabButtonElements.forEach((button) => {
        const section = button.getAttribute("data-transactions-tab");
        button.classList.toggle("active", activeRoute === "transactions" && section === activeTransactionSection);
      });

      creditCardTabButtonElements.forEach((button) => {
        const section = button.getAttribute("data-credit-card-tab");
        button.classList.toggle("active", activeRoute === "credit-cards" && section === activeCreditCardSection);
      });

      expenseTabButtonElements.forEach((button) => {
        const section = button.getAttribute("data-expense-tab");
        button.classList.toggle("active", activeRoute === "expenses" && section === activeExpenseSection);
      });
    }

    function bindTabNavigation() {
      tabButtonElements.forEach((button) => {
        button.addEventListener("click", () => {
          const route = button.getAttribute("data-route-tab");
          frontendRouter.navigate(route);
        });
      });

      settingsTabButtonElements.forEach((button) => {
        button.addEventListener("click", () => {
          const settingsSection = button.getAttribute("data-settings-tab");
          frontendRouter.navigate("settings", { settingsSection });
        });
      });

      transactionTabButtonElements.forEach((button) => {
        button.addEventListener("click", () => {
          const transactionSection = button.getAttribute("data-transactions-tab");
          frontendRouter.navigate("transactions", { transactionSection });
        });
      });

      creditCardTabButtonElements.forEach((button) => {
        button.addEventListener("click", () => {
          const creditCardSection = button.getAttribute("data-credit-card-tab");
          frontendRouter.navigate("credit-cards", { creditCardSection });
        });
      });

      expenseTabButtonElements.forEach((button) => {
        button.addEventListener("click", () => {
          const expenseSection = button.getAttribute("data-expense-tab");
          frontendRouter.navigate("expenses", { expenseSection });
        });
      });
    }

    return {
      applyRoute,
      bindTabNavigation,
    };
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { createAppRouting };
    return;
  }

  globalScope.createAppRouting = createAppRouting;
})(typeof globalThis !== "undefined" ? globalThis : window);
