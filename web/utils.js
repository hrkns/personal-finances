(function initFrontendUtils(globalScope) {
  function normalizeCurrencyInput(name, code) {
    return {
      name: String(name ?? "").trim(),
      code: String(code ?? "").trim().toUpperCase(),
    };
  }

  function normalizeBankInput(name, country) {
    return {
      name: String(name ?? "").trim(),
      country: String(country ?? "").trim().toUpperCase(),
    };
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  async function parseApiResponse(response) {
    if (response.status === 204) {
      return null;
    }

    const responseText = await response.text();
    const body = responseText ? JSON.parse(responseText) : null;

    if (!response.ok) {
      throw new Error(body?.error?.message || `Request failed: ${response.status}`);
    }

    return body;
  }

  const exported = {
    normalizeCurrencyInput,
    normalizeBankInput,
    escapeHtml,
    parseApiResponse,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = exported;
    return;
  }

  globalScope.frontendUtils = exported;
})(typeof globalThis !== "undefined" ? globalThis : window);