(function initBankAccountsModule(globalScope) {
  function createBankAccountsModule(config) {
    const {
      elements,
      apiRequest,
      normalizeBankAccountInput,
      escapeHtml,
      getBanks,
      getCurrencies,
      getBankAccounts,
      setBankAccounts,
    } = config;

    function setMessage(message, isError) {
      elements.messageElement.textContent = message;
      elements.messageElement.className = isError ? "error" : "success";
    }

    function resetForm() {
      elements.formElement.reset();
      elements.idElement.value = "";
      elements.submitButtonElement.textContent = "Create";
      elements.cancelButtonElement.hidden = true;
    }

    function formatBankLabel(bankID) {
      const bank = getBanks().find((item) => item.id === bankID);
      if (!bank) {
        return `#${bankID}`;
      }

      return `${bank.name} (${bank.country})`;
    }

    function formatCurrencyLabel(currencyID) {
      const currency = getCurrencies().find((item) => item.id === currencyID);
      if (!currency) {
        return `#${currencyID}`;
      }

      return `${currency.code} - ${currency.name}`;
    }

    function render() {
      const bankAccounts = getBankAccounts();
      elements.bodyElement.innerHTML = "";

      if (bankAccounts.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 6;
        cell.textContent = "No bank accounts yet";
        row.appendChild(cell);
        elements.bodyElement.appendChild(row);
        return;
      }

      for (const bankAccount of bankAccounts) {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${bankAccount.id}</td>
          <td>${escapeHtml(formatBankLabel(bankAccount.bank_id))}</td>
          <td>${escapeHtml(formatCurrencyLabel(bankAccount.currency_id))}</td>
          <td>${escapeHtml(bankAccount.account_number)}</td>
          <td>${escapeHtml(Number(bankAccount.balance).toFixed(2))}</td>
          <td>
            <button type="button" data-action="edit" data-id="${bankAccount.id}">Edit</button>
            <button type="button" data-action="delete" data-id="${bankAccount.id}">Delete</button>
          </td>
        `;
        elements.bodyElement.appendChild(row);
      }

      elements.bodyElement.querySelectorAll("button").forEach((button) => {
        button.addEventListener("click", onRowAction);
      });
    }

    async function load() {
      try {
        const bankAccounts = await apiRequest("/api/bank-accounts", { method: "GET" });
        setBankAccounts(bankAccounts);
        render();
      } catch (error) {
        setMessage(error.message, true);
      }
    }

    async function onSubmit(event) {
      event.preventDefault();

      const id = elements.idElement.value.trim();
      const payload = normalizeBankAccountInput(
        elements.bankIdElement.value,
        elements.currencyIdElement.value,
        elements.accountNumberElement.value,
        elements.balanceElement.value
      );

      try {
        if (id) {
          await apiRequest(`/api/bank-accounts/${id}`, {
            method: "PUT",
            body: JSON.stringify(payload),
          });
          setMessage("Bank account updated", false);
        } else {
          await apiRequest("/api/bank-accounts", {
            method: "POST",
            body: JSON.stringify(payload),
          });
          setMessage("Bank account created", false);
        }

        resetForm();
        await load();
      } catch (error) {
        setMessage(error.message, true);
      }
    }

    async function deleteBankAccount(id) {
      try {
        await apiRequest(`/api/bank-accounts/${id}`, { method: "DELETE" });
        setMessage("Bank account deleted", false);
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

      const bankAccount = getBankAccounts().find((item) => String(item.id) === id);
      if (!bankAccount) {
        return;
      }

      if (action === "edit") {
        elements.idElement.value = String(bankAccount.id);
        elements.bankIdElement.value = String(bankAccount.bank_id);
        elements.currencyIdElement.value = String(bankAccount.currency_id);
        elements.accountNumberElement.value = bankAccount.account_number;
        elements.balanceElement.value = String(bankAccount.balance);
        elements.submitButtonElement.textContent = "Update";
        elements.cancelButtonElement.hidden = false;
        setMessage(`Editing bank account #${bankAccount.id}`, false);
        return;
      }

      if (action === "delete") {
        deleteBankAccount(bankAccount.id);
      }
    }

    function populateBankOptions() {
      elements.bankIdElement.innerHTML = "";

      const defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.textContent = "Select bank";
      elements.bankIdElement.appendChild(defaultOption);

      for (const bank of getBanks()) {
        const option = document.createElement("option");
        option.value = String(bank.id);
        option.textContent = `${bank.name} (${bank.country})`;
        elements.bankIdElement.appendChild(option);
      }
    }

    function populateCurrencyOptions() {
      elements.currencyIdElement.innerHTML = "";

      const defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.textContent = "Select currency";
      elements.currencyIdElement.appendChild(defaultOption);

      for (const currency of getCurrencies()) {
        const option = document.createElement("option");
        option.value = String(currency.id);
        option.textContent = `${currency.code} - ${currency.name}`;
        elements.currencyIdElement.appendChild(option);
      }
    }

    return {
      load,
      render,
      onSubmit,
      onRowAction,
      resetForm,
      setMessage,
      populateBankOptions,
      populateCurrencyOptions,
    };
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { createBankAccountsModule };
    return;
  }

  globalScope.createBankAccountsModule = createBankAccountsModule;
})(typeof globalThis !== "undefined" ? globalThis : window);
