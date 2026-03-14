/**
 * Transactions table filtering controls and URL synchronization.
 */
(function initTransactionsTableFiltering(globalScope) {
  function createTransactionsTableFiltering(config) {
    const {
      globalScope: runtimeScope = globalScope,
      elements,
      getBankAccounts,
      formatBankAccountLabel,
      onFiltersChanged,
    } = config;

    const transactionsStartDateParamName = "transactionsStartDate";
    const transactionsEndDateParamName = "transactionsEndDate";
    const transactionsBankAccountsParamName = "transactionsBankAccounts";

    let isDateFilterBound = false;
    let isBankAccountFilterBound = false;
    let currentDateRange = getDefaultDateRange();
    let currentBankAccountFilterIDs = new Set();

    function formatDateAsISO(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }

    function getDefaultDateRange() {
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return {
        start: formatDateAsISO(startDate),
        end: formatDateAsISO(endDate),
      };
    }

    function isValidISODate(value) {
      if (typeof value !== "string") {
        return false;
      }

      const trimmedValue = value.trim();
      const matchedDate = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmedValue);
      if (!matchedDate) {
        return false;
      }

      const year = Number(matchedDate[1]);
      const month = Number(matchedDate[2]);
      const day = Number(matchedDate[3]);

      const parsedDate = new Date(Date.UTC(year, month - 1, day));
      return (
        parsedDate.getUTCFullYear() === year
        && parsedDate.getUTCMonth() + 1 === month
        && parsedDate.getUTCDate() === day
      );
    }

    function normalizeDateValue(value) {
      if (!isValidISODate(value)) {
        return null;
      }

      return String(value).trim();
    }

    function isDateRangeValid(startDate, endDate) {
      return Boolean(startDate && endDate && startDate <= endDate);
    }

    function normalizePositiveIntegerString(value) {
      const normalizedValue = String(value ?? "").trim();
      if (!/^\d+$/.test(normalizedValue)) {
        return null;
      }

      const numericValue = Number(normalizedValue);
      if (!Number.isInteger(numericValue) || numericValue <= 0) {
        return null;
      }

      return String(numericValue);
    }

    function serializeBankAccountIDs(ids) {
      return ids.join(",");
    }

    function replaceURLSearchParams(updater) {
      const url = new URL(runtimeScope.location.href);
      updater(url.searchParams);
      const nextURL = `${url.pathname}${url.search}${url.hash}`;
      const currentURL = `${runtimeScope.location.pathname}${runtimeScope.location.search}${runtimeScope.location.hash}`;
      if (nextURL !== currentURL) {
        runtimeScope.history.replaceState({}, "", nextURL);
      }
    }

    function removeDateRangeParamsFromURL() {
      replaceURLSearchParams((searchParams) => {
        searchParams.delete(transactionsStartDateParamName);
        searchParams.delete(transactionsEndDateParamName);
      });
    }

    function setDateRangeParamsInURL(startDate, endDate) {
      replaceURLSearchParams((searchParams) => {
        searchParams.set(transactionsStartDateParamName, startDate);
        searchParams.set(transactionsEndDateParamName, endDate);
      });
    }

    function removeBankAccountFilterParamFromURL() {
      replaceURLSearchParams((searchParams) => {
        searchParams.delete(transactionsBankAccountsParamName);
      });
    }

    function setBankAccountFilterParamInURL(ids) {
      replaceURLSearchParams((searchParams) => {
        if (ids.length === 0) {
          searchParams.delete(transactionsBankAccountsParamName);
          return;
        }

        searchParams.set(transactionsBankAccountsParamName, serializeBankAccountIDs(ids));
      });
    }

    function getAvailableBankAccountIDSet() {
      return new Set(getBankAccounts().map((item) => String(item.id)));
    }

    function getCanonicalPositiveIntegerIDs(ids) {
      const uniqueIDs = new Set();
      const canonicalIDs = [];

      for (const rawID of ids) {
        const normalizedID = normalizePositiveIntegerString(rawID);
        if (!normalizedID || uniqueIDs.has(normalizedID)) {
          continue;
        }

        uniqueIDs.add(normalizedID);
        canonicalIDs.push(normalizedID);
      }

      canonicalIDs.sort((left, right) => Number(left) - Number(right));
      return canonicalIDs;
    }

    function getSanitizedBankAccountIDs(ids) {
      const availableIDs = getAvailableBankAccountIDSet();
      const uniqueIDs = new Set();
      const sanitizedIDs = [];

      for (const rawID of ids) {
        const normalizedID = normalizePositiveIntegerString(rawID);
        if (!normalizedID || uniqueIDs.has(normalizedID) || !availableIDs.has(normalizedID)) {
          continue;
        }

        uniqueIDs.add(normalizedID);
        sanitizedIDs.push(normalizedID);
      }

      sanitizedIDs.sort((left, right) => Number(left) - Number(right));
      return sanitizedIDs;
    }

    function syncDateRangeControls() {
      if (elements.filterStartDateElement) {
        elements.filterStartDateElement.value = currentDateRange.start || "";
      }

      if (elements.filterEndDateElement) {
        elements.filterEndDateElement.value = currentDateRange.end || "";
      }

      if (elements.filterClearButtonElement) {
        elements.filterClearButtonElement.disabled = !currentDateRange.start && !currentDateRange.end;
      }
    }

    function syncBankAccountFilterControl() {
      if (!elements.filterBankAccountsElement) {
        return;
      }

      const selectedValues = new Set([...currentBankAccountFilterIDs].map((id) => String(id)));
      for (const option of elements.filterBankAccountsElement.options) {
        option.selected = selectedValues.has(option.value);
      }
    }

    function syncDateRangeFromURL() {
      const defaultDateRange = getDefaultDateRange();
      const params = new URLSearchParams(runtimeScope.location.search);
      const startDateParam = params.get(transactionsStartDateParamName);
      const endDateParam = params.get(transactionsEndDateParamName);

      if (!startDateParam && !endDateParam) {
        currentDateRange = defaultDateRange;
        setDateRangeParamsInURL(defaultDateRange.start, defaultDateRange.end);
        syncDateRangeControls();
        return;
      }

      const startDate = normalizeDateValue(startDateParam);
      const endDate = normalizeDateValue(endDateParam);
      if (isDateRangeValid(startDate, endDate)) {
        currentDateRange = { start: startDate, end: endDate };
        syncDateRangeControls();
        return;
      }

      currentDateRange = defaultDateRange;
      setDateRangeParamsInURL(defaultDateRange.start, defaultDateRange.end);
      syncDateRangeControls();
    }

    function syncBankAccountFilterFromURL() {
      const params = new URLSearchParams(runtimeScope.location.search);
      const bankAccountsParam = params.get(transactionsBankAccountsParamName);

      if (!bankAccountsParam) {
        currentBankAccountFilterIDs = new Set();
        syncBankAccountFilterControl();
        return;
      }

      const parsedValues = bankAccountsParam.split(",").map((value) => value.trim()).filter(Boolean);
      if (parsedValues.length === 0) {
        currentBankAccountFilterIDs = new Set();
        removeBankAccountFilterParamFromURL();
        syncBankAccountFilterControl();
        return;
      }

      const containsInvalidToken = parsedValues.some((value) => !normalizePositiveIntegerString(value));
      const availableIDs = getAvailableBankAccountIDSet();
      const canonicalIDs = getCanonicalPositiveIntegerIDs(parsedValues);
      const sanitizedIDs = availableIDs.size > 0
        ? getSanitizedBankAccountIDs(parsedValues)
        : canonicalIDs;
      const isValidParam = !containsInvalidToken && sanitizedIDs.length === canonicalIDs.length;

      if (!isValidParam) {
        currentBankAccountFilterIDs = new Set();
        removeBankAccountFilterParamFromURL();
        syncBankAccountFilterControl();
        return;
      }

      currentBankAccountFilterIDs = new Set(sanitizedIDs);
      setBankAccountFilterParamInURL(sanitizedIDs);
      syncBankAccountFilterControl();
    }

    function syncFromURL() {
      syncDateRangeFromURL();
      syncBankAccountFilterFromURL();
    }

    function clearDateRangeFilter() {
      currentDateRange = {
        start: "",
        end: "",
      };
      removeDateRangeParamsFromURL();
      syncDateRangeControls();
      onFiltersChanged();
    }

    function onDateRangeInputChange() {
      const startDate = normalizeDateValue(elements.filterStartDateElement?.value);
      const endDate = normalizeDateValue(elements.filterEndDateElement?.value);

      if (!startDate && !endDate) {
        clearDateRangeFilter();
        return;
      }

      if (isDateRangeValid(startDate, endDate)) {
        currentDateRange = { start: startDate, end: endDate };
        setDateRangeParamsInURL(startDate, endDate);
      } else {
        const defaultDateRange = getDefaultDateRange();
        currentDateRange = defaultDateRange;
        setDateRangeParamsInURL(defaultDateRange.start, defaultDateRange.end);
      }

      syncDateRangeControls();
      onFiltersChanged();
    }

    function onBankAccountFilterChange() {
      if (!elements.filterBankAccountsElement) {
        return;
      }

      const selectedIDs = getSanitizedBankAccountIDs(
        Array.from(elements.filterBankAccountsElement.selectedOptions, (option) => option.value)
      );

      currentBankAccountFilterIDs = new Set(selectedIDs);
      setBankAccountFilterParamInURL(selectedIDs);
      syncBankAccountFilterControl();
      onFiltersChanged();
    }

    function bindControlListeners() {
      if (
        !isDateFilterBound
        && elements.filterStartDateElement
        && elements.filterEndDateElement
        && elements.filterClearButtonElement
      ) {
        elements.filterStartDateElement.addEventListener("change", onDateRangeInputChange);
        elements.filterEndDateElement.addEventListener("change", onDateRangeInputChange);
        elements.filterClearButtonElement.addEventListener("click", clearDateRangeFilter);
        isDateFilterBound = true;
      }

      if (!isBankAccountFilterBound && elements.filterBankAccountsElement) {
        elements.filterBankAccountsElement.addEventListener("change", onBankAccountFilterChange);
        isBankAccountFilterBound = true;
      }
    }

    function populateBankAccountFilterOptions() {
      if (!elements.filterBankAccountsElement) {
        return;
      }

      const previousSelectedFilterIDs = [...currentBankAccountFilterIDs];
      elements.filterBankAccountsElement.innerHTML = "";

      for (const bankAccount of getBankAccounts()) {
        const option = document.createElement("option");
        option.value = String(bankAccount.id);
        option.textContent = formatBankAccountLabel(bankAccount.id);
        elements.filterBankAccountsElement.appendChild(option);
      }

      const availableIDs = getAvailableBankAccountIDSet();
      const sanitizedFilterIDs = availableIDs.size > 0
        ? getSanitizedBankAccountIDs(previousSelectedFilterIDs)
        : getCanonicalPositiveIntegerIDs(previousSelectedFilterIDs);
      currentBankAccountFilterIDs = new Set(sanitizedFilterIDs);
      setBankAccountFilterParamInURL(sanitizedFilterIDs);
      syncBankAccountFilterControl();
    }

    function filterTransactionsByDateRange(transactions) {
      if (!currentDateRange.start || !currentDateRange.end) {
        return transactions;
      }

      return transactions.filter((transaction) => {
        return transaction.transaction_date >= currentDateRange.start && transaction.transaction_date <= currentDateRange.end;
      });
    }

    function filterTransactionsByBankAccounts(transactions) {
      if (currentBankAccountFilterIDs.size === 0) {
        return transactions;
      }

      return transactions.filter((transaction) => currentBankAccountFilterIDs.has(String(transaction.bank_account_id)));
    }

    function filterTransactions(transactions) {
      return filterTransactionsByBankAccounts(filterTransactionsByDateRange(transactions));
    }

    return {
      syncFromURL,
      bindControlListeners,
      populateBankAccountFilterOptions,
      filterTransactions,
    };
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { createTransactionsTableFiltering };
    return;
  }

  globalScope.createTransactionsTableFiltering = createTransactionsTableFiltering;
})(typeof globalThis !== "undefined" ? globalThis : window);
