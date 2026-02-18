(function initTransactionsModule(globalScope) {
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
    } = config;

    function setMessage(message, isError) {
      elements.messageElement.textContent = message;
      elements.messageElement.className = isError ? "error" : "success";
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
      const category = getTransactionCategories().find((item) => item.id === categoryID);
      if (!category) {
        return `#${categoryID}`;
      }

      return category.name;
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
      elements.bodyElement.innerHTML = "";

      if (transactions.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 9;
        cell.textContent = "No transactions yet";
        row.appendChild(cell);
        elements.bodyElement.appendChild(row);
        return;
      }

      for (const transaction of transactions) {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${transaction.id}</td>
          <td>${escapeHtml(transaction.transaction_date)}</td>
          <td>${escapeHtml(transaction.type)}</td>
          <td>${escapeHtml(Number(transaction.amount).toFixed(2))}</td>
          <td>${escapeHtml(formatPersonLabel(transaction.person_id))}</td>
          <td>${escapeHtml(formatBankAccountLabel(transaction.bank_account_id))}</td>
          <td>${escapeHtml(formatCategoryLabel(transaction.category_id))}</td>
          <td>${escapeHtml(transaction.notes || "—")}</td>
          <td>
            <button type="button" data-action="edit" data-id="${transaction.id}">Edit</button>
            <button type="button" data-action="delete" data-id="${transaction.id}">Delete</button>
          </td>
        `;
        elements.bodyElement.appendChild(row);
      }

      elements.bodyElement.querySelectorAll("button").forEach((button) => {
        button.addEventListener("click", onRowAction);
      });
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
        option.textContent = `${category.name} (#${category.id})`;
        elements.categoryIdElement.appendChild(option);
      }

      elements.categoryIdElement.value = selectedValue;
    }

    async function load() {
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
      const action = event.target.getAttribute("data-action");
      const id = event.target.getAttribute("data-id");
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
        setMessage(`Editing transaction #${transaction.id}`, false);
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
