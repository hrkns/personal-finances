/**
 * Transactions table rendering and Bootstrap Table integration.
 */
(function initTransactionsTableModule(globalScope) {
  function createTransactionsTableModule(config) {
    const {
      globalScope: runtimeScope = globalScope,
      elements,
      escapeHtml,
      generateActionsCell,
      getTransactions,
      getBankAccounts,
      formatPersonLabel,
      formatBankAccountLabel,
      formatCategoryLabel,
      onRowAction,
    } = config;

    const urlState = runtimeScope.createTransactionsURLState({
      globalScope: runtimeScope,
    });
    const { replaceURLSearchParams } = urlState;

    const sorting = runtimeScope.createTransactionsTableSorting({
      globalScope: runtimeScope,
      replaceURLSearchParams,
    });

    const filtering = runtimeScope.createTransactionsTableFiltering({
      globalScope: runtimeScope,
      elements,
      getBankAccounts,
      formatBankAccountLabel,
      onFiltersChanged: () => {
        render();
      },
      shouldPersistDefaultDateRange: isTransactionsListRouteActive,
      replaceURLSearchParams,
      isValidISODate: runtimeScope.frontendUtils.isValidISODate,
    });

    let isRowActionBound = false;
    let isSortChangeBound = false;
    let isRouteActivationBound = false;

    function isTransactionsListRouteActive() {
      const searchParams = new URLSearchParams(runtimeScope.location.search);
      return searchParams.get("view") === "transactions" && searchParams.get("transactions") === "list";
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
          && typeof runtimeScope.jQuery === "function"
          && runtimeScope.jQuery.fn
          && typeof runtimeScope.jQuery.fn.bootstrapTable === "function"
      );
    }

    function normalizeActionsHtml(actionsCellHtml) {
      return actionsCellHtml
        .replace(/^\s*<td\b[^>]*>/i, "")
        .replace(/<\/td>\s*$/i, "");
    }

    function computeRunningBalanceByTransactionID(transactions) {
      const runningBalanceByBankAccountID = new Map(
        getBankAccounts().map((bankAccount) => [bankAccount.id, Number(bankAccount.balance)])
      );
      const runningBalanceByTransactionID = new Map();

      const orderedForBalance = sorting.sortTransactionsByDateAsc(transactions);
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
      const runningBalanceByTransactionID = computeRunningBalanceByTransactionID(transactions);
      const filteredTransactions = filtering.filterTransactions(transactions);
      const orderedTransactions = sorting.sortTransactions(filteredTransactions);

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
          notes: escapeHtml(transaction.notes || "—"),
          actions: normalizeActionsHtml(generateActionsCell(transaction)),
        };
      });
    }

    function renderWithBootstrapTable(rows) {
      const tableQuery = runtimeScope.jQuery(elements.tableElement);
      const currentSort = sorting.getCurrentSort();
      const currentSortField = sorting.toSortField(currentSort.key);
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

    function initializeSortChangeBindings() {
      if (isSortChangeBound || !supportsBootstrapTable()) {
        return;
      }

      const tableQuery = runtimeScope.jQuery(elements.tableElement);
      tableQuery.on("sort.bs.table", (event, sortField, sortOrder) => {
        sorting.onBootstrapSortChange(sortField, sortOrder);
      });

      isSortChangeBound = true;
    }

    function onTransactionsListActivated() {
      syncFromURL();
      render();
    }

    function isTransactionsListRouteState(routeState) {
      return routeState?.route === "transactions" && routeState?.transactionSection === "list";
    }

    function onRouteStateChanged(routeState) {
      if (!isTransactionsListRouteState(routeState) && !isTransactionsListRouteActive()) {
        return;
      }

      onTransactionsListActivated();
    }

    function initializeRouteActivationBindings() {
      if (isRouteActivationBound) {
        return;
      }

      runtimeScope.addEventListener("app:route-changed", (event) => {
        onRouteStateChanged(event.detail || null);
      });

      runtimeScope.addEventListener("popstate", () => {
        onRouteStateChanged(null);
      });

      isRouteActivationBound = true;
    }

    function initialize() {
      initializeRowActionBindings();
      syncFromURL();
      initializeSortChangeBindings();
      initializeRouteActivationBindings();
      filtering.bindControlListeners();
    }

    function syncFromURL() {
      sorting.syncFromURL();
      filtering.syncFromURL();
    }

    function populateBankAccountFilterOptions() {
      filtering.populateBankAccountFilterOptions();
    }

    function render() {
      const rows = buildRenderRows(getTransactions());

      if (supportsBootstrapTable()) {
        renderWithBootstrapTable(rows);
        return;
      }

      renderWithTBody(rows);
    }

    return {
      initialize,
      syncFromURL,
      render,
      populateBankAccountFilterOptions,
    };
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { createTransactionsTableModule };
    return;
  }

  globalScope.createTransactionsTableModule = createTransactionsTableModule;
})(typeof globalThis !== "undefined" ? globalThis : window);
