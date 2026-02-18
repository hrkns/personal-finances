(function initAppRouting(globalScope) {
  function createAppRouting(config) {
    const {
      tabButtonElements,
      views,
      frontendRouter,
    } = config;

    function applyRoute(route) {
      const activeRoute = route || "home";

      views.home.hidden = activeRoute !== "home";
      views.transactionCategories.hidden = activeRoute !== "transaction-categories";
      views.people.hidden = activeRoute !== "people";
      views.bankAccounts.hidden = activeRoute !== "bank-accounts";
      views.banks.hidden = activeRoute !== "banks";
      views.currency.hidden = activeRoute !== "currency";

      tabButtonElements.forEach((button) => {
        const tabRoute = button.getAttribute("data-route-tab");
        button.classList.toggle("active", tabRoute === activeRoute);
      });
    }

    function bindTabNavigation() {
      tabButtonElements.forEach((button) => {
        button.addEventListener("click", () => {
          const route = button.getAttribute("data-route-tab");
          frontendRouter.navigate(route);
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
