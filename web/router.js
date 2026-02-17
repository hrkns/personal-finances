(function initFrontendRouter(globalScope) {
  const validRoutes = new Set(["home", "bank-accounts", "banks", "currency"]);

  function normalizeRoute(route) {
    return String(route ?? "").trim().toLowerCase();
  }

  function readRouteFromURL() {
    const params = new URLSearchParams(window.location.search);
    const route = normalizeRoute(params.get("view") || "home");
    return validRoutes.has(route) ? route : null;
  }

  function buildURLForRoute(route) {
    const url = new URL(window.location.href);
    if (route === "home") {
      url.searchParams.delete("view");
    } else {
      url.searchParams.set("view", route);
    }
    return `${url.pathname}${url.search}${url.hash}`;
  }

  function dispatchRouteChange(route) {
    window.dispatchEvent(
      new CustomEvent("app:route-changed", {
        detail: { route },
      })
    );
  }

  function navigate(route, options = {}) {
    const normalized = normalizeRoute(route);
    const targetRoute = validRoutes.has(normalized) ? normalized : "home";
    const targetURL = buildURLForRoute(targetRoute);
    const method = options.replace ? "replaceState" : "pushState";

    if (`${window.location.pathname}${window.location.search}${window.location.hash}` !== targetURL) {
      window.history[method]({}, "", targetURL);
    }

    dispatchRouteChange(targetRoute);
    return targetRoute;
  }

  function ensureValidRoute() {
    const route = readRouteFromURL();
    if (route) {
      return route;
    }

    navigate("home", { replace: true });
    return "home";
  }

  function onRouteChange(callback) {
    const handler = () => {
      callback(ensureValidRoute());
    };

    const customHandler = (event) => {
      callback(event.detail.route);
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
