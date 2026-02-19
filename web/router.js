(function initFrontendRouter(globalScope) {
  const validRoutes = new Set(["home", "transactions", "credit-cards", "settings"]);
  const validSettingsSections = new Set(["transaction-categories", "people", "bank-accounts", "banks", "currency"]);

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

    return `${url.pathname}${url.search}${url.hash}`;
  }

  function dispatchRouteChange(route, settingsSection) {
    window.dispatchEvent(
      new CustomEvent("app:route-changed", {
        detail: { route, settingsSection },
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
    const targetURL = buildURLForRoute(targetRoute, { settingsSection: targetSettingsSection });
    const method = options.replace ? "replaceState" : "pushState";

    if (`${window.location.pathname}${window.location.search}${window.location.hash}` !== targetURL) {
      window.history[method]({}, "", targetURL);
    }

    dispatchRouteChange(targetRoute, targetSettingsSection);
    return { route: targetRoute, settingsSection: targetSettingsSection };
  }

  function ensureValidRoute() {
    const route = readRouteFromURL();
    if (route) {
      if (route !== "settings") {
        return { route, settingsSection: null };
      }

      const params = new URLSearchParams(window.location.search);
      if (!params.has("settings")) {
        return { route, settingsSection: null };
      }

      const settingsSection = readSettingsSectionFromURL();
      if (settingsSection) {
        return { route, settingsSection };
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
