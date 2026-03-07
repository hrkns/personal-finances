(function initFrontendRouter(globalScope) {
  const validRoutes = new Set(["home", "transactions", "credit-cards", "expenses", "settings"]);
  const validSettingsSections = new Set(["transaction-categories", "people", "bank-accounts", "banks", "currency"]);
  const validCreditCardSections = new Set(["cards", "cycles", "installments", "subscriptions"]);
  const validExpenseSections = new Set(["expenses", "payments"]);

  function normalizeRoute(route) {
    return String(route ?? "").trim().toLowerCase();
  }

  function readRouteFromURL() {
    const params = new URLSearchParams(window.location.search);
    const route = normalizeRoute(params.get("view") || "home");
    return validRoutes.has(route) ? route : null;
  }

  function readRawRouteFromURL() {
    const params = new URLSearchParams(window.location.search);
    return normalizeRoute(params.get("view") || "home");
  }

  function readSettingsSectionFromURL() {
    const params = new URLSearchParams(window.location.search);
    const sectionParam = params.get("settings");
    if (!sectionParam) {
      return null;
    }

    const section = normalizeRoute(sectionParam);
    return validSettingsSections.has(section) ? section : null;
  }

  function readCreditCardSectionFromURL() {
    const params = new URLSearchParams(window.location.search);
    const sectionParam = params.get("creditCards");
    if (!sectionParam) {
      return null;
    }

    const section = normalizeRoute(sectionParam);
    return validCreditCardSections.has(section) ? section : null;
  }

  function readExpenseSectionFromURL() {
    const params = new URLSearchParams(window.location.search);
    const sectionParam = params.get("expenses");
    if (!sectionParam) {
      return null;
    }

    const section = normalizeRoute(sectionParam);
    return validExpenseSections.has(section) ? section : null;
  }

  function buildURLForRoute(route, options = {}) {
    const url = new URL(window.location.href);
    if (route === "home") {
      url.searchParams.delete("view");
    } else {
      url.searchParams.set("view", route);
    }

    if (route === "settings") {
      const requestedSection = normalizeRoute(options.settingsSection);
      if (validSettingsSections.has(requestedSection)) {
        url.searchParams.set("settings", requestedSection);
      } else {
        url.searchParams.delete("settings");
      }
    } else {
      url.searchParams.delete("settings");
    }

    if (route === "credit-cards") {
      const requestedSection = normalizeRoute(options.creditCardSection);
      if (validCreditCardSections.has(requestedSection)) {
        url.searchParams.set("creditCards", requestedSection);
      } else {
        url.searchParams.delete("creditCards");
      }
    } else {
      url.searchParams.delete("creditCards");
    }

    if (route === "expenses") {
      const requestedSection = normalizeRoute(options.expenseSection);
      if (validExpenseSections.has(requestedSection)) {
        url.searchParams.set("expenses", requestedSection);
      } else {
        url.searchParams.delete("expenses");
      }
    } else {
      url.searchParams.delete("expenses");
    }

    return `${url.pathname}${url.search}${url.hash}`;
  }

  function dispatchRouteChange(route, settingsSection, creditCardSection, expenseSection) {
    window.dispatchEvent(
      new CustomEvent("app:route-changed", {
        detail: { route, settingsSection, creditCardSection, expenseSection },
      })
    );
  }

  function navigate(route, options = {}) {
    const normalized = normalizeRoute(route);
    const targetRoute = validRoutes.has(normalized) ? normalized : "home";
    const targetSettingsSection = targetRoute === "settings"
      ? (validSettingsSections.has(normalizeRoute(options.settingsSection))
        ? normalizeRoute(options.settingsSection)
        : null)
      : null;
    const targetCreditCardSection = targetRoute === "credit-cards"
      ? (validCreditCardSections.has(normalizeRoute(options.creditCardSection))
        ? normalizeRoute(options.creditCardSection)
        : "cards")
      : null;
    const targetExpenseSection = targetRoute === "expenses"
      ? (validExpenseSections.has(normalizeRoute(options.expenseSection))
        ? normalizeRoute(options.expenseSection)
        : "expenses")
      : null;
    const targetURL = buildURLForRoute(targetRoute, {
      settingsSection: targetSettingsSection,
      creditCardSection: targetCreditCardSection,
      expenseSection: targetExpenseSection,
    });
    const method = options.replace ? "replaceState" : "pushState";

    if (`${window.location.pathname}${window.location.search}${window.location.hash}` !== targetURL) {
      window.history[method]({}, "", targetURL);
    }

    dispatchRouteChange(targetRoute, targetSettingsSection, targetCreditCardSection, targetExpenseSection);
    return {
      route: targetRoute,
      settingsSection: targetSettingsSection,
      creditCardSection: targetCreditCardSection,
      expenseSection: targetExpenseSection,
    };
  }

  function ensureValidRoute() {
    const route = readRouteFromURL();
    if (route) {
      if (route === "credit-cards") {
        const params = new URLSearchParams(window.location.search);
        if (!params.has("creditCards")) {
          return navigate("credit-cards", { replace: true, creditCardSection: "cards" });
        }

        const creditCardSection = readCreditCardSectionFromURL();
        if (creditCardSection) {
          return { route, settingsSection: null, creditCardSection, expenseSection: null };
        }

        return navigate("credit-cards", { replace: true, creditCardSection: "cards" });
      }

      if (route === "expenses") {
        const params = new URLSearchParams(window.location.search);
        if (!params.has("expenses")) {
          return navigate("expenses", { replace: true, expenseSection: "expenses" });
        }

        const expenseSection = readExpenseSectionFromURL();
        if (expenseSection) {
          return { route, settingsSection: null, creditCardSection: null, expenseSection };
        }

        return navigate("expenses", { replace: true, expenseSection: "expenses" });
      }

      if (route !== "settings") {
        return { route, settingsSection: null, creditCardSection: null, expenseSection: null };
      }

      const params = new URLSearchParams(window.location.search);
      if (!params.has("settings")) {
        return { route, settingsSection: null, creditCardSection: null, expenseSection: null };
      }

      const settingsSection = readSettingsSectionFromURL();
      if (settingsSection) {
        return { route, settingsSection, creditCardSection: null, expenseSection: null };
      }

      return navigate("settings", { replace: true });
    }

    const rawRoute = readRawRouteFromURL();

    if (validSettingsSections.has(rawRoute)) {
      return navigate("settings", { replace: true, settingsSection: rawRoute });
    }

    return navigate("home", { replace: true });
  }

  function onRouteChange(callback) {
    const handler = () => {
      callback(ensureValidRoute());
    };

    const customHandler = (event) => {
      callback({
        route: event.detail.route,
        settingsSection: event.detail.settingsSection || null,
        creditCardSection: event.detail.creditCardSection || null,
        expenseSection: event.detail.expenseSection || null,
      });
    };

    window.addEventListener("popstate", handler);
    window.addEventListener("app:route-changed", customHandler);

    return () => {
      window.removeEventListener("popstate", handler);
      window.removeEventListener("app:route-changed", customHandler);
    };
  }

  const exported = {
    validRoutes: [...validRoutes],
    validSettingsSections: [...validSettingsSections],
    validCreditCardSections: [...validCreditCardSections],
    validExpenseSections: [...validExpenseSections],
    navigate,
    ensureValidRoute,
    onRouteChange,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = exported;
    return;
  }

  globalScope.frontendRouter = exported;
})(typeof globalThis !== "undefined" ? globalThis : window);
