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

    const tableModule = globalScope.createTransactionsTableModule({
      globalScope,
      elements,
      escapeHtml,
      generateActionsCell,
      getTransactions,
      getBankAccounts,
      formatPersonLabel,
      formatBankAccountLabel,
      formatCategoryLabel,
      onRowAction,
    });

    function initializeModalBindings() {
      initModalBindings(resetForm);
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
      tableModule.render();
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
      tableModule.populateBankAccountFilterOptions();
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
      tableModule.initialize();

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
        tableModule.syncFromURL();
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
        tableModule.syncFromURL();
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
