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

    let isRowActionBound = false;

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

    function sortTransactionsByDateDesc(transactions) {
      return [...transactions].sort((left, right) => {
        const dateCompare = right.transaction_date.localeCompare(left.transaction_date);
        if (dateCompare !== 0) {
          return dateCompare;
        }

        return Number(right.id) - Number(left.id);
      });
    }

    function computeRunningBalanceByTransactionID(transactions) {
      const runningBalanceByBankAccountID = new Map(
        getBankAccounts().map((bankAccount) => [bankAccount.id, Number(bankAccount.balance)])
      );
      const runningBalanceByTransactionID = new Map();

      const orderedForBalance = [...transactions].sort((left, right) => {
        const dateCompare = left.transaction_date.localeCompare(right.transaction_date);
        if (dateCompare !== 0) {
          return dateCompare;
        }

        return Number(left.id) - Number(right.id);
      });

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
      const orderedTransactions = sortTransactionsByDateDesc(transactions);

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
          sortName: "transactionDate",
          sortOrder: "desc",
          formatNoMatches: () => "No transactions yet",
        });
      } else {
        tableQuery.bootstrapTable("load", rows);
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
