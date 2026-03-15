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
      shouldPersistDefaultDateRange = () => true,
      replaceURLSearchParams,
      isValidISODate,
    } = config;

    const transactionsStartDateParamName = "transactionsStartDate";
    const transactionsEndDateParamName = "transactionsEndDate";
    const transactionsBankAccountsParamName = "transactionsBankAccounts";

    let isDateFilterBound = false;
    let isBankAccountFilterBound = false;
    let currentDateRange = getDefaultDateRange();
    let currentDateRangeInput = { ...currentDateRange };
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

    if (typeof replaceURLSearchParams !== "function") {
      throw new Error("createTransactionsTableFiltering requires replaceURLSearchParams");
    }

    if (typeof isValidISODate !== "function") {
      throw new Error("createTransactionsTableFiltering requires isValidISODate");
    }

    function normalizeDateValue(value) {
      if (!isValidISODate(value)) {
        return null;
      }

      return String(value).trim();
    }

    function isDateRangeInvalid(startDate, endDate) {
      return Boolean(startDate && endDate && startDate > endDate);
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

    function removeDateRangeParamsFromURL() {
      replaceURLSearchParams((searchParams) => {
        searchParams.delete(transactionsStartDateParamName);
        searchParams.delete(transactionsEndDateParamName);
      });
    }

    function setDateRangeParamsInURL(startDate, endDate) {
      replaceURLSearchParams((searchParams) => {
        if (startDate) {
          searchParams.set(transactionsStartDateParamName, startDate);
        } else {
          searchParams.delete(transactionsStartDateParamName);
        }

        if (endDate) {
          searchParams.set(transactionsEndDateParamName, endDate);
        } else {
          searchParams.delete(transactionsEndDateParamName);
        }
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
        elements.filterStartDateElement.value = currentDateRangeInput.start || "";
      }

      if (elements.filterEndDateElement) {
        elements.filterEndDateElement.value = currentDateRangeInput.end || "";
      }

      if (elements.filterClearButtonElement) {
        elements.filterClearButtonElement.disabled = !currentDateRangeInput.start && !currentDateRangeInput.end;
      }
    }

    function syncClearFilterControls() {
      if (elements.filterClearBankAccountsButton) {
        elements.filterClearBankAccountsButton.disabled = currentBankAccountFilterIDs.size === 0;
      }
    }

    function clearFilterMessage() {
      if (elements.filterMessage) {
        elements.filterMessage.textContent = "";
      }
    }

    function setFilterMessage(message) {
      if (elements.filterMessage) {
        elements.filterMessage.textContent = message;
      }
    }

    function syncBankAccountFilterControl() {
      if (!elements.filterBankAccountsElement) {
        syncClearFilterControls();
        return;
      }

      const selectedValues = new Set([...currentBankAccountFilterIDs].map((id) => String(id)));
      for (const option of elements.filterBankAccountsElement.options) {
        option.selected = selectedValues.has(option.value);
      }

      syncClearFilterControls();
    }

    function syncDateRangeFromURL() {
      const defaultDateRange = getDefaultDateRange();
      const params = new URLSearchParams(runtimeScope.location.search);
      const startDateParam = params.get(transactionsStartDateParamName);
      const endDateParam = params.get(transactionsEndDateParamName);

      if (!startDateParam && !endDateParam) {
        currentDateRange = defaultDateRange;
        currentDateRangeInput = { ...defaultDateRange };
        if (shouldPersistDefaultDateRange()) {
          setDateRangeParamsInURL(defaultDateRange.start, defaultDateRange.end);
        }
        clearFilterMessage();
        syncDateRangeControls();
        return;
      }

      const startDate = normalizeDateValue(startDateParam);
      const endDate = normalizeDateValue(endDateParam);
      const hasInvalidDateToken = Boolean(startDateParam && !startDate) || Boolean(endDateParam && !endDate);
      if (!hasInvalidDateToken && !isDateRangeInvalid(startDate, endDate)) {
        currentDateRange = { start: startDate, end: endDate };
        currentDateRangeInput = { ...currentDateRange };
        setDateRangeParamsInURL(startDate, endDate);
        clearFilterMessage();
        syncDateRangeControls();
        return;
      }

      currentDateRange = defaultDateRange;
      currentDateRangeInput = { ...defaultDateRange };
      setDateRangeParamsInURL(defaultDateRange.start, defaultDateRange.end);
      clearFilterMessage();
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
      currentDateRangeInput = { ...currentDateRange };
      removeDateRangeParamsFromURL();
      clearFilterMessage();
      syncDateRangeControls();
      onFiltersChanged();
    }

    function applyDefaultDateRange() {
      const defaultDateRange = getDefaultDateRange();
      currentDateRange = defaultDateRange;
      currentDateRangeInput = { ...defaultDateRange };
      setDateRangeParamsInURL(defaultDateRange.start, defaultDateRange.end);
      clearFilterMessage();
      syncDateRangeControls();
    }

    function clearBankAccountFilter() {
      currentBankAccountFilterIDs = new Set();
      removeBankAccountFilterParamFromURL();
      syncBankAccountFilterControl();
      onFiltersChanged();
    }

    function clearAllFilters() {
      applyDefaultDateRange();
      currentBankAccountFilterIDs = new Set();
      removeBankAccountFilterParamFromURL();
      syncBankAccountFilterControl();
      onFiltersChanged();
    }

    function onDateRangeInputChange() {
      const startDate = normalizeDateValue(elements.filterStartDateElement?.value);
      const endDate = normalizeDateValue(elements.filterEndDateElement?.value);
      currentDateRangeInput = {
        start: startDate || "",
        end: endDate || "",
      };

      if (isDateRangeInvalid(startDate, endDate)) {
        setFilterMessage("Start date must be on or before end date.");
        syncDateRangeControls();
        onFiltersChanged();
        return;
      }

      clearFilterMessage();

      if (!startDate && !endDate) {
        clearDateRangeFilter();
        return;
      }

      currentDateRange = { start: startDate || "", end: endDate || "" };
      setDateRangeParamsInURL(currentDateRange.start, currentDateRange.end);

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
        if (elements.filterClearAllButton) {
          elements.filterClearAllButton.addEventListener("click", clearAllFilters);
        }
        isDateFilterBound = true;
      }

      if (!isBankAccountFilterBound && elements.filterBankAccountsElement) {
        elements.filterBankAccountsElement.addEventListener("change", onBankAccountFilterChange);
        if (elements.filterClearBankAccountsButton) {
          elements.filterClearBankAccountsButton.addEventListener("click", clearBankAccountFilter);
        }
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
      if (isDateRangeInvalid(currentDateRangeInput.start, currentDateRangeInput.end)) {
        return [];
      }

      if (!currentDateRange.start && !currentDateRange.end) {
        return transactions;
      }

      return transactions.filter((transaction) => {
        if (currentDateRange.start && transaction.transaction_date < currentDateRange.start) {
          return false;
        }

        if (currentDateRange.end && transaction.transaction_date > currentDateRange.end) {
          return false;
        }

        return true;
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
