/**
 * Shared URL state helpers for transactions table modules.
 */
(function initTransactionsURLState(globalScope) {
  function createTransactionsURLState(config = {}) {
    const {
      globalScope: runtimeScope = globalScope,
    } = config;

    function replaceURLSearchParams(updater) {
      const url = new URL(runtimeScope.location.href);
      updater(url.searchParams);
      const nextURL = `${url.pathname}${url.search}${url.hash}`;
      const currentURL = `${runtimeScope.location.pathname}${runtimeScope.location.search}${runtimeScope.location.hash}`;
      if (nextURL !== currentURL) {
        runtimeScope.history.replaceState({}, "", nextURL);
      }
    }

    return {
      replaceURLSearchParams,
    };
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { createTransactionsURLState };
    return;
  }

  globalScope.createTransactionsURLState = createTransactionsURLState;
})(typeof globalThis !== "undefined" ? globalThis : window);
