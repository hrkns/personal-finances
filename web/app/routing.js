(function initAppRouting(globalScope) {
  function createAppRouting(config) {
    const {
      tabButtonElements,
      settingsTabButtonElements,
      creditCardTabButtonElements,
      settingsSelectionMessageElement,
      views,
      settingsViews,
      creditCardViews,
      frontendRouter,
    } = config;

    function normalizeRouteState(routeState) {
      if (typeof routeState === "string") {
        return {
          route: routeState,
          settingsSection: null,
          creditCardSection: null,
        };
      }

      return {
        route: routeState?.route || "home",
        settingsSection: routeState?.settingsSection || null,
        creditCardSection: routeState?.creditCardSection || null,
      };
    }

    function applyRoute(routeState) {
      const state = normalizeRouteState(routeState);
      const activeRoute = state.route;
      const activeSettingsSection = state.settingsSection;
      const activeCreditCardSection = state.creditCardSection;

      views.home.hidden = activeRoute !== "home";
      views.transactions.hidden = activeRoute !== "transactions";
      views.creditCards.hidden = activeRoute !== "credit-cards";
      views.settings.hidden = activeRoute !== "settings";

      settingsViews.transactionCategories.hidden =
        activeRoute !== "settings" || activeSettingsSection !== "transaction-categories";
      settingsViews.people.hidden = activeRoute !== "settings" || activeSettingsSection !== "people";
      settingsViews.bankAccounts.hidden = activeRoute !== "settings" || activeSettingsSection !== "bank-accounts";
      settingsViews.banks.hidden = activeRoute !== "settings" || activeSettingsSection !== "banks";
      settingsViews.currency.hidden = activeRoute !== "settings" || activeSettingsSection !== "currency";

      creditCardViews.cards.hidden = activeRoute !== "credit-cards" || activeCreditCardSection !== "cards";
      creditCardViews.cycles.hidden = activeRoute !== "credit-cards" || activeCreditCardSection !== "cycles";

      settingsSelectionMessageElement.hidden =
        activeRoute !== "settings" || Boolean(activeSettingsSection);

      tabButtonElements.forEach((button) => {
        const tabRoute = button.getAttribute("data-route-tab");
        button.classList.toggle("active", tabRoute === activeRoute);
      });

      settingsTabButtonElements.forEach((button) => {
        const section = button.getAttribute("data-settings-tab");
        button.classList.toggle("active", activeRoute === "settings" && section === activeSettingsSection);
      });

      creditCardTabButtonElements.forEach((button) => {
        const section = button.getAttribute("data-credit-card-tab");
        button.classList.toggle("active", activeRoute === "credit-cards" && section === activeCreditCardSection);
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

      creditCardTabButtonElements.forEach((button) => {
        button.addEventListener("click", () => {
          const creditCardSection = button.getAttribute("data-credit-card-tab");
          frontendRouter.navigate("credit-cards", { creditCardSection });
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
