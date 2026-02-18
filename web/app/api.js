(function initAppAPI(globalScope) {
  function createApiRequest(parseApiResponse) {
    return async function apiRequest(url, options) {
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
        },
        ...options,
      });

      return parseApiResponse(response);
    };
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { createApiRequest };
    return;
  }

  globalScope.createApiRequest = createApiRequest;
})(typeof globalThis !== "undefined" ? globalThis : window);
