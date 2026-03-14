/**
 * Transactions table sorting state and URL synchronization.
 */
(function initTransactionsTableSorting(globalScope) {
  function createTransactionsTableSorting(config) {
    const {
      globalScope: runtimeScope = globalScope,
    } = config;

    const transactionsSortParamName = "transactionsSort";
    const transactionsOrderParamName = "transactionsOrder";
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

    let currentSort = { ...defaultSort };

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
      const url = new URL(runtimeScope.location.href);
      updater(url.searchParams);
      const nextURL = `${url.pathname}${url.search}${url.hash}`;
      const currentURL = `${runtimeScope.location.pathname}${runtimeScope.location.search}${runtimeScope.location.hash}`;
      if (nextURL !== currentURL) {
        runtimeScope.history.replaceState({}, "", nextURL);
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

    function syncFromURL() {
      const params = new URLSearchParams(runtimeScope.location.search);
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

    function sortTransactions(transactions) {
      const sorted = [...transactions].sort((left, right) => {
        if (currentSort.key === "amount") {
          return compareTransactionsByAmount(left, right);
        }

        return compareTransactionsByDate(left, right);
      });

      return currentSort.order === "desc" ? sorted.reverse() : sorted;
    }

    function sortTransactionsByDateAsc(transactions) {
      return [...transactions].sort(compareTransactionsByDate);
    }

    function onBootstrapSortChange(sortField, sortOrder) {
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
    }

    function getCurrentSort() {
      return { ...currentSort };
    }

    return {
      syncFromURL,
      sortTransactions,
      sortTransactionsByDateAsc,
      onBootstrapSortChange,
      getCurrentSort,
      toSortField,
    };
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { createTransactionsTableSorting };
    return;
  }

  globalScope.createTransactionsTableSorting = createTransactionsTableSorting;
})(typeof globalThis !== "undefined" ? globalThis : window);
