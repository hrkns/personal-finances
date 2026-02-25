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

  function normalizePersonInput(name) {
    return {
      name: String(name ?? "").trim(),
    };
  }

  function normalizeTransactionCategoryInput(name, parentId) {
    const parsedParentID = Number(String(parentId ?? "").trim());

    return {
      name: String(name ?? "").trim(),
      parent_id: Number.isInteger(parsedParentID) && parsedParentID > 0 ? parsedParentID : null,
    };
  }

  function normalizeBankAccountInput(bankId, currencyId, accountNumber, balance) {
    return {
      bank_id: Number.parseInt(String(bankId ?? ""), 10),
      currency_id: Number.parseInt(String(currencyId ?? ""), 10),
      account_number: String(accountNumber ?? "").trim(),
      balance: Number.parseFloat(String(balance ?? "0")),
    };
  }

  function normalizeCreditCardInput(bankId, personId, number, name) {
    const normalizedName = String(name ?? "").trim();

    return {
      bank_id: Number.parseInt(String(bankId ?? ""), 10),
      person_id: Number.parseInt(String(personId ?? ""), 10),
      number: String(number ?? "").trim(),
      name: normalizedName ? normalizedName : null,
    };
  }

  function normalizeCreditCardCycleInput(creditCardID, closingDate, dueDate) {
    return {
      credit_card_id: Number.parseInt(String(creditCardID ?? ""), 10),
      closing_date: String(closingDate ?? "").trim(),
      due_date: String(dueDate ?? "").trim(),
    };
  }

  function normalizeCreditCardCycleBalanceInput(creditCardCycleID, currencyID, balance, paid) {
    return {
      credit_card_cycle_id: Number.parseInt(String(creditCardCycleID ?? ""), 10),
      currency_id: Number.parseInt(String(currencyID ?? ""), 10),
      balance: Number.parseFloat(String(balance ?? "0")),
      paid: Boolean(paid),
    };
  }

  function normalizeCreditCardInstallmentInput(creditCardID, concept, amount, startDate, count) {
    return {
      credit_card_id: Number.parseInt(String(creditCardID ?? ""), 10),
      concept: String(concept ?? "").trim(),
      amount: Number.parseFloat(String(amount ?? "0")),
      start_date: String(startDate ?? "").trim(),
      count: Number.parseInt(String(count ?? ""), 10),
    };
  }

  function normalizeTransactionInput(transactionDate, type, amount, notes, personId, bankAccountId, categoryId) {
    const normalizedNotes = String(notes ?? "").trim();

    return {
      transaction_date: String(transactionDate ?? "").trim(),
      type: String(type ?? "").trim().toLowerCase(),
      amount: Number.parseFloat(String(amount ?? "0")),
      notes: normalizedNotes ? normalizedNotes : null,
      person_id: Number.parseInt(String(personId ?? ""), 10),
      bank_account_id: Number.parseInt(String(bankAccountId ?? ""), 10),
      category_id: Number.parseInt(String(categoryId ?? ""), 10),
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
    normalizePersonInput,
    normalizeTransactionCategoryInput,
    normalizeBankAccountInput,
    normalizeCreditCardInput,
    normalizeCreditCardCycleInput,
    normalizeCreditCardCycleBalanceInput,
    normalizeCreditCardInstallmentInput,
    normalizeTransactionInput,
    escapeHtml,
    parseApiResponse,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = exported;
    return;
  }

  globalScope.frontendUtils = exported;
})(typeof globalThis !== "undefined" ? globalThis : window);