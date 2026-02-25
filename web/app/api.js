/**
 * API adapter factory.
 *
 * Analogy:
 * - React: similar to creating a shared `apiClient` utility used by hooks/services.
 * - Angular: similar to a lightweight `HttpClient` wrapper service.
 * - Vue: similar to a composable that wraps `fetch` + response parsing.
 */
(function initAppAPI(globalScope) {
  /**
   * Creates a request function that enforces JSON headers and delegates response parsing.
   *
   * @param {(response: Response) => Promise<any>} parseApiResponse Parses and validates API responses.
   * @returns {(url: string, options?: RequestInit) => Promise<any>} Shared API request function.
   */
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
