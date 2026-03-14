/**
 * Transactions feature module.
 *
 * Analogy:
 * - React: similar to a smart page component that joins multiple stores (people,
 *   accounts, categories) into one normalized view model.
 * - Angular: similar to a container component with several injected services.
 * - Vue: similar to a composable that computes labels from related entity stores.
 */
(function initTransactionsModule(globalScope) {
  /**
   * Creates transactions controller with CRUD operations and relational label formatting.
   *
   * @param {{
   *   elements: object,
   *   apiRequest: (url: string, options?: RequestInit) => Promise<any>,
   *   normalizeTransactionInput: Function,
   *   escapeHtml: (value: any) => string,
   *   getPeople: () => any[],
   *   getBanks: () => any[],
   *   getCurrencies: () => any[],
   *   getBankAccounts: () => any[],
   *   getTransactionCategories: () => any[],
   *   getTransactions: () => any[],
   *   setTransactions: (items: any[]) => void,
   *   generateActionsCell: (item: any) => string
   * }} config
   * @returns {{load: Function, render: Function, onSubmit: Function, onRowAction: Function, resetForm: Function, setMessage: Function, populatePersonOptions: Function, populateBankAccountOptions: Function, populateCategoryOptions: Function}}
   */
  function createTransactionsModule(config) {
    const {
      elements,
      apiRequest,
      normalizeTransactionInput,
      escapeHtml,
      getPeople,
      getBanks,
      getCurrencies,
      getBankAccounts,
      getTransactionCategories,
      getTransactions,
      setTransactions,
      generateActionsCell,
    } = config;

    const {
      setMessage,
      showModal,
      hideModal,
      initModalBindings,
    } = globalScope.createUIFeedback({ elements, globalScope });

    const transactionsSortParamName = "transactionsSort";
    const transactionsOrderParamName = "transactionsOrder";
    const transactionsStartDateParamName = "transactionsStartDate";
    const transactionsEndDateParamName = "transactionsEndDate";
    const transactionsBankAccountsParamName = "transactionsBankAccounts";
    const sortKeyByField = {
      transactionDate: "date",
      amount: "amount",
    };
    const sortFieldByKey = {
      date: "transactionDate",
      amount: "amount",
    };
    const defaultSort = {
      key: "date",
      order: "desc",
    };

    let isRowActionBound = false;
    let isSortChangeBound = false;
    let isDateFilterBound = false;
    let isBankAccountFilterBound = false;
    let currentSort = { ...defaultSort };
    let currentDateRange = getDefaultDateRange();
    let currentBankAccountFilterIDs = new Set();

    function initializeModalBindings() {
      initModalBindings(resetForm);
    }

    function initializeRowActionBindings() {
      if (isRowActionBound || !elements.bodyElement) {
        return;
      }

      // Delegate actions so handlers continue working after table redraws.
      elements.bodyElement.addEventListener("click", onRowAction);
      isRowActionBound = true;
    }

    function supportsBootstrapTable() {
      return Boolean(
        elements.tableElement
          && typeof globalScope.jQuery === "function"
          && globalScope.jQuery.fn
          && typeof globalScope.jQuery.fn.bootstrapTable === "function"
      );
    }

    function normalizeActionsHtml(actionsCellHtml) {
      return actionsCellHtml
        .replace(/^\s*<td>/i, "")
        .replace(/<\/td>\s*$/i, "");
    }

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
      const options = elements.filterBankAccountsElement.options;
      for (const option of options) {
        option.selected = selectedValues.has(option.value);
      }
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

    function getAvailableBankAccountIDSet() {
      return new Set(getBankAccounts().map((item) => String(item.id)));
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

    function serializeBankAccountIDs(ids) {
      return ids.join(",");
    }

    function normalizeSortKey(value) {
      const normalizedValue = String(value ?? "").trim().toLowerCase();
      return sortFieldByKey[normalizedValue] ? normalizedValue : null;
    }

    function normalizeSortOrder(value) {
      const normalizedValue = String(value ?? "").trim().toLowerCase();
      return normalizedValue === "asc" || normalizedValue === "desc" ? normalizedValue : null;
    }

    function toSortField(sortKey) {
      return sortFieldByKey[sortKey] || sortFieldByKey[defaultSort.key];
    }

    function toSortKey(sortField) {
      return sortKeyByField[sortField] || null;
    }

    function replaceURLSearchParams(updater) {
      const url = new URL(globalScope.location.href);
      updater(url.searchParams);
      const nextURL = `${url.pathname}${url.search}${url.hash}`;
      const currentURL = `${globalScope.location.pathname}${globalScope.location.search}${globalScope.location.hash}`;
      if (nextURL !== currentURL) {
        globalScope.history.replaceState({}, "", nextURL);
      }
    }

    function removeSortParamsFromURL() {
      replaceURLSearchParams((searchParams) => {
        searchParams.delete(transactionsSortParamName);
        searchParams.delete(transactionsOrderParamName);
      });
    }

    function setSortParamsInURL(sortKey, sortOrder) {
      replaceURLSearchParams((searchParams) => {
        searchParams.set(transactionsSortParamName, sortKey);
        searchParams.set(transactionsOrderParamName, sortOrder);
      });
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

    function syncBankAccountFilterFromURL() {
      const params = new URLSearchParams(globalScope.location.search);
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
      const sanitizedIDs = availableIDs.size > 0
        ? getSanitizedBankAccountIDs(parsedValues)
        : getCanonicalPositiveIntegerIDs(parsedValues);
      const isValidParam = !containsInvalidToken && sanitizedIDs.length === getCanonicalPositiveIntegerIDs(parsedValues).length;

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
      render();
    }

    function initializeBankAccountFilterBindings() {
      if (isBankAccountFilterBound || !elements.filterBankAccountsElement) {
        return;
      }

      elements.filterBankAccountsElement.addEventListener("change", onBankAccountFilterChange);
      isBankAccountFilterBound = true;
    }

    function syncDateRangeFromURL() {
      const defaultDateRange = getDefaultDateRange();
      const params = new URLSearchParams(globalScope.location.search);
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

    function clearDateRangeFilter() {
      currentDateRange = {
        start: "",
        end: "",
      };
      removeDateRangeParamsFromURL();
      syncDateRangeControls();
      render();
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
      render();
    }

    function initializeDateFilterBindings() {
      if (
        isDateFilterBound
        || !elements.filterStartDateElement
        || !elements.filterEndDateElement
        || !elements.filterClearButtonElement
      ) {
        return;
      }

      elements.filterStartDateElement.addEventListener("change", onDateRangeInputChange);
      elements.filterEndDateElement.addEventListener("change", onDateRangeInputChange);
      elements.filterClearButtonElement.addEventListener("click", clearDateRangeFilter);
      isDateFilterBound = true;
    }

    function syncSortFromURL() {
      const params = new URLSearchParams(globalScope.location.search);
      const sortParam = params.get(transactionsSortParamName);
      const orderParam = params.get(transactionsOrderParamName);

      if (!sortParam && !orderParam) {
        currentSort = { ...defaultSort };
        return;
      }

      const sortKey = normalizeSortKey(sortParam);
      const sortOrder = normalizeSortOrder(orderParam);

      if (sortKey && sortOrder) {
        currentSort = { key: sortKey, order: sortOrder };
        return;
      }

      removeSortParamsFromURL();
      currentSort = { ...defaultSort };
    }

    function compareTransactionsByDate(left, right) {
      const dateCompare = left.transaction_date.localeCompare(right.transaction_date);
      if (dateCompare !== 0) {
        return dateCompare;
      }

      return Number(left.id) - Number(right.id);
    }

    function compareTransactionsByAmount(left, right) {
      const amountCompare = Number(left.amount) - Number(right.amount);
      if (amountCompare !== 0) {
        return amountCompare;
      }

      return Number(left.id) - Number(right.id);
    }

    function sortTransactions(transactions, sortKey, sortOrder) {
      const sorted = [...transactions].sort((left, right) => {
        if (sortKey === "amount") {
          return compareTransactionsByAmount(left, right);
        }

        return compareTransactionsByDate(left, right);
      });

      return sortOrder === "desc" ? sorted.reverse() : sorted;
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

    function computeRunningBalanceByTransactionID(transactions) {
      const runningBalanceByBankAccountID = new Map(
        getBankAccounts().map((bankAccount) => [bankAccount.id, Number(bankAccount.balance)])
      );
      const runningBalanceByTransactionID = new Map();

      const orderedForBalance = sortTransactions(transactions, "date", "asc");

      for (const transaction of orderedForBalance) {
        const previousBalance = runningBalanceByBankAccountID.get(transaction.bank_account_id) ?? 0;
        const amount = Number(transaction.amount);
        const nextBalance = transaction.type === "income" ? previousBalance + amount : previousBalance - amount;
        runningBalanceByBankAccountID.set(transaction.bank_account_id, nextBalance);
        runningBalanceByTransactionID.set(transaction.id, nextBalance);
      }

      return runningBalanceByTransactionID;
    }

    function buildRenderRows(transactions) {
      const filteredByDateTransactions = filterTransactionsByDateRange(transactions);
      const filteredTransactions = filterTransactionsByBankAccounts(filteredByDateTransactions);
      const runningBalanceByTransactionID = computeRunningBalanceByTransactionID(filteredTransactions);
      const orderedTransactions = sortTransactions(filteredTransactions, currentSort.key, currentSort.order);

      return orderedTransactions.map((transaction) => {
        const amount = Number(transaction.amount);
        const runningBalance = runningBalanceByTransactionID.get(transaction.id) ?? 0;

        return {
          id: transaction.id,
          transactionDate: escapeHtml(transaction.transaction_date),
          type: escapeHtml(transaction.type),
          amount: escapeHtml(amount.toFixed(2)),
          amountValue: amount,
          person: escapeHtml(formatPersonLabel(transaction.person_id)),
          bankAccount: escapeHtml(formatBankAccountLabel(transaction.bank_account_id)),
          balance: escapeHtml(runningBalance.toFixed(2)),
          category: escapeHtml(formatCategoryLabel(transaction.category_id)),
          notes: escapeHtml(transaction.notes || "-"),
          actions: normalizeActionsHtml(generateActionsCell(transaction)),
        };
      });
    }

    function renderWithBootstrapTable(rows) {
      const tableQuery = globalScope.jQuery(elements.tableElement);
      const currentSortField = toSortField(currentSort.key);
      const columns = [
        { field: "id", title: "ID" },
        { field: "transactionDate", title: "Date", sortable: true },
        { field: "type", title: "Type" },
        {
          field: "amount",
          title: "Amount",
          sortable: true,
          sorter: (leftAmount, rightAmount, leftRow, rightRow) => Number(leftRow.amountValue) - Number(rightRow.amountValue),
        },
        { field: "person", title: "Person" },
        { field: "bankAccount", title: "Bank Account" },
        { field: "balance", title: "Balance" },
        { field: "category", title: "Category" },
        { field: "notes", title: "Notes" },
        { field: "actions", title: "Actions", escape: false },
      ];

      if (!tableQuery.data("bootstrap.table")) {
        tableQuery.bootstrapTable({
          columns,
          data: rows,
          pagination: false,
          search: false,
          sortReset: true,
          locale: "en-US",
          sortName: currentSortField,
          sortOrder: currentSort.order,
          formatNoMatches: () => "No transactions yet",
        });
      } else {
        tableQuery.bootstrapTable("load", rows);

        const options = tableQuery.bootstrapTable("getOptions") || {};
        if (options.sortName !== currentSortField || options.sortOrder !== currentSort.order) {
          tableQuery.bootstrapTable("sortBy", {
            field: currentSortField,
            sortOrder: currentSort.order,
          });
        }
      }
    }

    function initializeSortChangeBindings() {
      if (isSortChangeBound || !supportsBootstrapTable()) {
        return;
      }

      const tableQuery = globalScope.jQuery(elements.tableElement);
      tableQuery.on("sort.bs.table", (event, sortField, sortOrder) => {
        const sortKey = normalizeSortKey(toSortKey(sortField));
        const normalizedSortOrder = normalizeSortOrder(sortOrder);

        if (!sortKey || !normalizedSortOrder) {
          removeSortParamsFromURL();
          currentSort = { ...defaultSort };
          return;
        }

        currentSort = {
          key: sortKey,
          order: normalizedSortOrder,
        };
        setSortParamsInURL(sortKey, normalizedSortOrder);
      });

      isSortChangeBound = true;
    }

    function renderWithTBody(rows) {
      elements.bodyElement.innerHTML = "";

      if (rows.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 10;
        cell.textContent = "No transactions yet";
        row.appendChild(cell);
        elements.bodyElement.appendChild(row);
        return;
      }

      for (const rowData of rows) {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${rowData.id}</td>
          <td>${rowData.transactionDate}</td>
          <td>${rowData.type}</td>
          <td>${rowData.amount}</td>
          <td>${rowData.person}</td>
          <td>${rowData.bankAccount}</td>
          <td>${rowData.balance}</td>
          <td>${rowData.category}</td>
          <td>${rowData.notes}</td>
          <td>${rowData.actions}</td>
        `;
        elements.bodyElement.appendChild(row);
      }
    }

    function formatPersonLabel(personID) {
      const person = getPeople().find((item) => item.id === personID);
      if (!person) {
        return `#${personID}`;
      }

      return person.name;
    }

    function formatBankAccountLabel(bankAccountID) {
      const bankAccount = getBankAccounts().find((item) => item.id === bankAccountID);
      if (!bankAccount) {
        return `#${bankAccountID}`;
      }

      const bank = getBanks().find((item) => item.id === bankAccount.bank_id);
      const currency = getCurrencies().find((item) => item.id === bankAccount.currency_id);

      const bankLabel = bank ? bank.name : `Bank #${bankAccount.bank_id}`;
      const currencyLabel = currency ? currency.code : `Currency #${bankAccount.currency_id}`;

      return `${bankLabel} - ${currencyLabel} - ${bankAccount.account_number}`;
    }

    function formatCategoryLabel(categoryID) {
      const categories = getTransactionCategories();
      const category = categories.find((item) => item.id === categoryID);

      if (!category) {
        return `#${categoryID}`;
      }

      const categoryByID = new Map(categories.map((item) => [item.id, item]));
      const path = [];
      const visitedIDs = new Set();

      let currentCategory = category;
      while (currentCategory) {
        if (visitedIDs.has(currentCategory.id)) {
          break;
        }

        path.push(currentCategory.name);
        visitedIDs.add(currentCategory.id);

        if (!currentCategory.parent_id) {
          break;
        }

        currentCategory = categoryByID.get(currentCategory.parent_id);
      }

      return path.reverse().join(" - ");
    }

    function resetForm() {
      elements.formElement.reset();
      elements.idElement.value = "";
      elements.submitButtonElement.textContent = "Create";
      elements.cancelButtonElement.hidden = true;
      elements.typeElement.value = "income";
      populatePersonOptions();
      populateBankAccountOptions();
      populateCategoryOptions();
    }

    function render() {
      const transactions = getTransactions();
      const rows = buildRenderRows(transactions);

      if (supportsBootstrapTable()) {
        renderWithBootstrapTable(rows);
        return;
      }

      renderWithTBody(rows);
    }

    function populatePersonOptions() {
      const selectedValue = elements.personIdElement.value;
      elements.personIdElement.innerHTML = "";

      const defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.textContent = "Select person";
      elements.personIdElement.appendChild(defaultOption);

      for (const person of getPeople()) {
        const option = document.createElement("option");
        option.value = String(person.id);
        option.textContent = `${person.name} (#${person.id})`;
        elements.personIdElement.appendChild(option);
      }

      elements.personIdElement.value = selectedValue;
    }

    function populateBankAccountOptions() {
      const selectedValue = elements.bankAccountIdElement.value;
      elements.bankAccountIdElement.innerHTML = "";

      const defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.textContent = "Select bank account";
      elements.bankAccountIdElement.appendChild(defaultOption);

      for (const bankAccount of getBankAccounts()) {
        const option = document.createElement("option");
        option.value = String(bankAccount.id);
        option.textContent = formatBankAccountLabel(bankAccount.id);
        elements.bankAccountIdElement.appendChild(option);
      }

      elements.bankAccountIdElement.value = selectedValue;

      if (elements.filterBankAccountsElement) {
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
    }

    function populateCategoryOptions() {
      const selectedValue = elements.categoryIdElement.value;
      elements.categoryIdElement.innerHTML = "";

      const defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.textContent = "Select category";
      elements.categoryIdElement.appendChild(defaultOption);

      for (const category of getTransactionCategories()) {
        const option = document.createElement("option");
        option.value = String(category.id);
        option.textContent = formatCategoryLabel(category.id);
        elements.categoryIdElement.appendChild(option);
      }

      elements.categoryIdElement.value = selectedValue;
    }

    async function load() {
      initializeModalBindings();
      initializeRowActionBindings();
      syncSortFromURL();
      syncDateRangeFromURL();
      syncBankAccountFilterFromURL();
      initializeSortChangeBindings();
      initializeDateFilterBindings();
      initializeBankAccountFilterBindings();

      try {
        const transactions = await apiRequest("/api/transactions", { method: "GET" });
        setTransactions(transactions);
        populatePersonOptions();
        populateBankAccountOptions();
        populateCategoryOptions();
        render();
      } catch (error) {
        setMessage(error.message, true);
      }
    }

    async function onSubmit(event) {
      event.preventDefault();

      const id = elements.idElement.value.trim();
      const payload = normalizeTransactionInput(
        elements.dateElement.value,
        elements.typeElement.value,
        elements.amountElement.value,
        elements.notesElement.value,
        elements.personIdElement.value,
        elements.bankAccountIdElement.value,
        elements.categoryIdElement.value
      );

      try {
        if (id) {
          await apiRequest(`/api/transactions/${id}`, {
            method: "PUT",
            body: JSON.stringify(payload),
          });
          setMessage("Transaction updated", false);
        } else {
          await apiRequest("/api/transactions", {
            method: "POST",
            body: JSON.stringify(payload),
          });
          setMessage("Transaction created", false);
        }

        hideModal();
        syncBankAccountFilterFromURL();
        resetForm();
        await load();
      } catch (error) {
        setMessage(error.message, true);
      }
    }

    async function deleteTransaction(id) {
      try {
        await apiRequest(`/api/transactions/${id}`, { method: "DELETE" });
        setMessage("Transaction deleted", false);
        syncBankAccountFilterFromURL();
        resetForm();
        await load();
      } catch (error) {
        setMessage(error.message, true);
      }
    }

    function onRowAction(event) {
      const button = event.target.closest("button[data-action][data-id]");
      if (!button) {
        return;
      }

      const action = button.getAttribute("data-action");
      const id = button.getAttribute("data-id");
      if (!id) {
        return;
      }

      const transaction = getTransactions().find((item) => String(item.id) === id);
      if (!transaction) {
        return;
      }

      if (action === "edit") {
        elements.idElement.value = String(transaction.id);
        elements.dateElement.value = transaction.transaction_date;
        elements.typeElement.value = transaction.type;
        elements.amountElement.value = String(transaction.amount);
        elements.notesElement.value = transaction.notes || "";
        elements.personIdElement.value = String(transaction.person_id);
        elements.bankAccountIdElement.value = String(transaction.bank_account_id);
        elements.categoryIdElement.value = String(transaction.category_id);
        elements.submitButtonElement.textContent = "Update";
        elements.cancelButtonElement.hidden = false;
        if (elements.modalTitleElement) {
          elements.modalTitleElement.textContent = "Edit transaction";
        }
        showModal();
        return;
      }

      if (action === "delete") {
        deleteTransaction(transaction.id);
      }
    }

    return {
      load,
      render,
      onSubmit,
      onRowAction,
      resetForm,
      setMessage,
      populatePersonOptions,
      populateBankAccountOptions,
      populateCategoryOptions,
    };
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { createTransactionsModule };
    return;
  }

  globalScope.createTransactionsModule = createTransactionsModule;
})(typeof globalThis !== "undefined" ? globalThis : window);
