/**
 * Credit Card Cycle Balances feature module.
 */
(function initCreditCardCycleBalancesModule(globalScope) {
  /**
   * @param {{
   *   elements: object,
   *   apiRequest: (url: string, options?: RequestInit) => Promise<any>,
   *   normalizeCreditCardCycleBalanceInput: Function,
   *   escapeHtml: (value: any) => string,
   *   getCreditCards: () => any[],
   *   getCreditCardCycles: () => any[],
   *   getCurrencies: () => any[],
   *   getCreditCardCycleBalances: () => any[],
   *   setCreditCardCycleBalances: (items: any[]) => void,
   *   generateActionsCell: (item: any) => string
   * }} config
   */
  function createCreditCardCycleBalancesModule(config) {
    const {
      elements,
      apiRequest,
      normalizeCreditCardCycleBalanceInput,
      escapeHtml,
      getCreditCards,
      getCreditCardCycles,
      getCurrencies,
      getCreditCardCycleBalances,
      setCreditCardCycleBalances,
      generateActionsCell,
    } = config;

    const bootstrapModal = globalScope.bootstrap?.Modal;
    const bootstrapToast = globalScope.bootstrap?.Toast;
    const hasModalSupport = Boolean(bootstrapModal && elements.modalElement);
    const hasToastSupport = Boolean(bootstrapToast && elements.toastElement);
    const modalInstance = hasModalSupport ? bootstrapModal.getOrCreateInstance(elements.modalElement) : null;
    const toastInstance = hasToastSupport ? bootstrapToast.getOrCreateInstance(elements.toastElement) : null;
    let modalBindingsInitialized = false;

    function setMessage(message, isError) {
      elements.messageElement.textContent = message;

      if (hasToastSupport) {
        elements.toastElement.classList.remove("text-bg-success", "text-bg-danger");
        elements.toastElement.classList.add(isError ? "text-bg-danger" : "text-bg-success");
        toastInstance.show();
        return;
      }

      elements.messageElement.className = isError ? "error" : "success";
    }

    function showModal() {
      if (modalInstance) {
        modalInstance.show();
      }
    }

    function hideModal() {
      if (modalInstance) {
        modalInstance.hide();
      }
    }

    function initializeModalBindings() {
      if (modalBindingsInitialized) {
        return;
      }

      if (elements.openModalButtonElement) {
        elements.openModalButtonElement.addEventListener("click", () => {
          resetForm();
          showModal();
        });
      }

      if (elements.cancelButtonElement) {
        elements.cancelButtonElement.addEventListener("click", () => {
          hideModal();
          resetForm();
        });
      }

      if (elements.modalElement) {
        elements.modalElement.addEventListener("hidden.bs.modal", () => {
          resetForm();
        });
      }

      modalBindingsInitialized = true;
    }

    function formatCreditCardLabel(creditCardID) {
      const creditCard = getCreditCards().find((item) => item.id === creditCardID);
      if (!creditCard) {
        return `#${creditCardID}`;
      }

      if (creditCard.name) {
        return `${creditCard.number} (${creditCard.name})`;
      }

      return creditCard.number;
    }

    function formatCycleLabel(cycleID) {
      const cycle = getCreditCardCycles().find((item) => item.id === cycleID);
      if (!cycle) {
        return `#${cycleID}`;
      }

      return `${formatCreditCardLabel(cycle.credit_card_id)} (${cycle.closing_date} → ${cycle.due_date})`;
    }

    function formatCurrencyLabel(currencyID) {
      const currency = getCurrencies().find((item) => item.id === currencyID);
      if (!currency) {
        return `#${currencyID}`;
      }

      return `${currency.code} (${currency.name})`;
    }

    function populateCycleOptions() {
      const selectedValue = elements.cycleIdElement.value;
      elements.cycleIdElement.innerHTML = "";

      const defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.textContent = "Select credit card cycle";
      elements.cycleIdElement.appendChild(defaultOption);

      for (const cycle of getCreditCardCycles()) {
        const option = document.createElement("option");
        option.value = String(cycle.id);
        option.textContent = formatCycleLabel(cycle.id);
        elements.cycleIdElement.appendChild(option);
      }

      elements.cycleIdElement.value = selectedValue;
    }

    function populateCurrencyOptions() {
      const selectedValue = elements.currencyIdElement.value;
      elements.currencyIdElement.innerHTML = "";

      const defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.textContent = "Select currency";
      elements.currencyIdElement.appendChild(defaultOption);

      for (const currency of getCurrencies()) {
        const option = document.createElement("option");
        option.value = String(currency.id);
        option.textContent = formatCurrencyLabel(currency.id);
        elements.currencyIdElement.appendChild(option);
      }

      elements.currencyIdElement.value = selectedValue;
    }

    function resetForm() {
      elements.formElement.reset();
      elements.idElement.value = "";
      elements.submitButtonElement.textContent = "Create";
      if (elements.modalTitleElement) {
        elements.modalTitleElement.textContent = "Create credit card cycle balance";
      }
      populateCycleOptions();
      populateCurrencyOptions();
    }

    function render() {
      const balances = getCreditCardCycleBalances();
      elements.bodyElement.innerHTML = "";

      if (balances.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 6;
        cell.textContent = "No credit card cycle balances yet";
        row.appendChild(cell);
        elements.bodyElement.appendChild(row);
        return;
      }

      for (const balance of balances) {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${balance.id}</td>
          <td>${escapeHtml(formatCycleLabel(balance.credit_card_cycle_id))}</td>
          <td>${escapeHtml(formatCurrencyLabel(balance.currency_id))}</td>
          <td>${escapeHtml(balance.balance)}</td>
          <td>${balance.paid ? "Yes" : "No"}</td>
          ${generateActionsCell(balance)}
        `;
        elements.bodyElement.appendChild(row);
      }

      elements.bodyElement.querySelectorAll("button").forEach((button) => {
        button.addEventListener("click", onRowAction);
      });
    }

    async function load() {
      initializeModalBindings();

      try {
        const balances = await apiRequest("/api/credit-card-cycle-balances", { method: "GET" });
        setCreditCardCycleBalances(balances);
        populateCycleOptions();
        populateCurrencyOptions();
        render();
      } catch (error) {
        setMessage(error.message, true);
      }
    }

    async function onSubmit(event) {
      event.preventDefault();

      const id = elements.idElement.value.trim();
      const payload = normalizeCreditCardCycleBalanceInput(
        elements.cycleIdElement.value,
        elements.currencyIdElement.value,
        elements.balanceElement.value,
        elements.paidElement.checked
      );

      if (!Number.isInteger(payload.credit_card_cycle_id) || payload.credit_card_cycle_id <= 0) {
        setMessage("credit_card_cycle_id must be a positive integer", true);
        return;
      }

      const hasDuplicateCurrency = getCreditCardCycleBalances().some((item) => {
        if (id && String(item.id) === id) {
          return false;
        }

        return item.credit_card_cycle_id === payload.credit_card_cycle_id && item.currency_id === payload.currency_id;
      });

      if (hasDuplicateCurrency) {
        setMessage("A balance with this currency already exists for the selected cycle", true);
        return;
      }

      try {
        if (id) {
          await apiRequest(`/api/credit-card-cycle-balances/${id}`, {
            method: "PUT",
            body: JSON.stringify(payload),
          });
          setMessage("Credit card cycle balance updated", false);
        } else {
          await apiRequest(`/api/credit-card-cycle-balances`, {
            method: "POST",
            body: JSON.stringify(payload),
          });
          setMessage("Credit card cycle balance created", false);
        }

        resetForm();
        hideModal();
        await load();
      } catch (error) {
        setMessage(error.message, true);
      }
    }

    async function deleteBalance(balance) {
      try {
        await apiRequest(`/api/credit-card-cycle-balances/${balance.id}`, { method: "DELETE" });
        setMessage("Credit card cycle balance deleted", false);
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

      const balance = getCreditCardCycleBalances().find((item) => String(item.id) === id);
      if (!balance) {
        return;
      }

      if (action === "edit") {
        elements.idElement.value = String(balance.id);
        elements.cycleIdElement.value = String(balance.credit_card_cycle_id);
        elements.currencyIdElement.value = String(balance.currency_id);
        elements.balanceElement.value = String(balance.balance);
        elements.paidElement.checked = Boolean(balance.paid);
        elements.submitButtonElement.textContent = "Update";
        if (elements.modalTitleElement) {
          elements.modalTitleElement.textContent = `Edit credit card cycle balance #${balance.id}`;
        }
        showModal();
        return;
      }

      if (action === "delete") {
        deleteBalance(balance);
      }
    }

    return {
      load,
      render,
      onSubmit,
      onRowAction,
      resetForm,
      setMessage,
      populateCycleOptions,
      populateCurrencyOptions,
    };
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { createCreditCardCycleBalancesModule };
    return;
  }

  globalScope.createCreditCardCycleBalancesModule = createCreditCardCycleBalancesModule;
})(typeof globalThis !== "undefined" ? globalThis : window);
