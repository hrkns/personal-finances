/**
 * Credit Card Cycles feature module.
 *
 * Analogy:
 * - React: this combines two related slices (cycles + cycle balances) like a parent
 *   page coordinating a nested child resource.
 * - Angular: similar to a master-detail component where selecting a cycle drives
 *   a nested balances panel.
 * - Vue: similar to a composable that manages both parent entity state and selected-child context.
 */
(function initCreditCardCyclesModule(globalScope) {
  /**
   * Creates cycle controller with nested balance management and selection context.
   *
   * @param {{
   *   elements: object,
   *   balanceElements: object,
   *   apiRequest: (url: string, options?: RequestInit) => Promise<any>,
   *   normalizeCreditCardCycleInput: Function,
   *   normalizeCreditCardCycleBalanceInput: Function,
   *   escapeHtml: (value: any) => string,
   *   getCreditCards: () => any[],
   *   getCurrencies: () => any[],
   *   getCreditCardCycles: () => any[],
   *   setCreditCardCycles: (items: any[]) => void,
   *   getCreditCardCycleBalances: () => any[],
   *   setCreditCardCycleBalances: (items: any[]) => void
   * }} config
   * @returns {{
   *   load: Function,
   *   render: Function,
   *   renderBalances: Function,
   *   onSubmit: Function,
   *   onRowAction: Function,
   *   resetForm: Function,
   *   onBalanceSubmit: Function,
   *   resetBalanceForm: Function,
   *   setMessage: Function,
   *   populateCreditCardOptions: Function,
   *   populateBalanceCurrencyOptions: Function
   * }}
   */
  function createCreditCardCyclesModule(config) {
    const {
      elements,
      balanceElements,
      apiRequest,
      normalizeCreditCardCycleInput,
      normalizeCreditCardCycleBalanceInput,
      escapeHtml,
      getCreditCards,
      getCurrencies,
      getCreditCardCycles,
      setCreditCardCycles,
      getCreditCardCycleBalances,
      setCreditCardCycleBalances,
    } = config;

    let selectedCycleID = null;
    let isLoadingBalances = false;

    function setMessage(message, isError) {
      elements.messageElement.textContent = message;
      elements.messageElement.className = isError ? "error" : "success";
    }

    function resetForm() {
      elements.formElement.reset();
      elements.idElement.value = "";
      elements.submitButtonElement.textContent = "Create";
      elements.cancelButtonElement.hidden = true;
      populateCreditCardOptions();
    }

    function setBalanceMessage(message, isError) {
      balanceElements.messageElement.textContent = message;
      balanceElements.messageElement.className = isError ? "error" : "success";
    }

    function resetBalanceForm() {
      balanceElements.formElement.reset();
      balanceElements.idElement.value = "";
      balanceElements.submitButtonElement.textContent = "Create";
      balanceElements.cancelButtonElement.hidden = true;
      balanceElements.cycleIdElement.value = selectedCycleID ? String(selectedCycleID) : "";
      populateBalanceCurrencyOptions();
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

    function render() {
      const cycles = getCreditCardCycles();
      elements.bodyElement.innerHTML = "";

      if (selectedCycleID && !cycles.some((item) => item.id === selectedCycleID)) {
        selectedCycleID = null;
        setCreditCardCycleBalances([]);
      }

      if (cycles.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 5;
        cell.textContent = "No credit card cycles yet";
        row.appendChild(cell);
        elements.bodyElement.appendChild(row);
        return;
      }

      for (const cycle of cycles) {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${cycle.id}</td>
          <td>${escapeHtml(formatCreditCardLabel(cycle.credit_card_id))}</td>
          <td>${escapeHtml(cycle.closing_date)}</td>
          <td>${escapeHtml(cycle.due_date)}</td>
          <td>
            <button type="button" data-action="balances" data-id="${cycle.id}">Balances</button>
            <button type="button" data-action="edit" data-id="${cycle.id}">Edit</button>
            <button type="button" data-action="delete" data-id="${cycle.id}">Delete</button>
          </td>
        `;
        elements.bodyElement.appendChild(row);
      }

      elements.bodyElement.querySelectorAll("button").forEach((button) => {
        button.addEventListener("click", onRowAction);
      });
    }

    function formatCurrencyLabel(currencyID) {
      const currency = getCurrencies().find((item) => item.id === currencyID);
      if (!currency) {
        return `#${currencyID}`;
      }

      return `${currency.code} (${currency.name})`;
    }

    function populateBalanceCurrencyOptions() {
      const selectedValue = balanceElements.currencyIdElement.value;
      balanceElements.currencyIdElement.innerHTML = "";

      const defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.textContent = "Select currency";
      balanceElements.currencyIdElement.appendChild(defaultOption);

      for (const currency of getCurrencies()) {
        const option = document.createElement("option");
        option.value = String(currency.id);
        option.textContent = `${currency.code} (${currency.name})`;
        balanceElements.currencyIdElement.appendChild(option);
      }

      balanceElements.currencyIdElement.value = selectedValue;
    }

    function renderBalances() {
      const balances = getCreditCardCycleBalances();
      balanceElements.bodyElement.innerHTML = "";

      if (!selectedCycleID) {
        balanceElements.selectionMessageElement.hidden = false;
        balanceElements.selectionMessageElement.textContent = "Select a cycle balance context to continue.";
        balanceElements.formElement.hidden = true;

        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 5;
        cell.textContent = "No cycle selected";
        row.appendChild(cell);
        balanceElements.bodyElement.appendChild(row);
        return;
      }

      const selectedCycle = getCreditCardCycles().find((item) => item.id === selectedCycleID);
      balanceElements.selectionMessageElement.hidden = false;

      if (isLoadingBalances) {
        balanceElements.selectionMessageElement.textContent = selectedCycle
          ? `Loading balances for cycle #${selectedCycleID} (${selectedCycle.closing_date} → ${selectedCycle.due_date})...`
          : `Loading balances for cycle #${selectedCycleID}...`;
        balanceElements.formElement.hidden = false;
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 5;
        cell.textContent = "Loading cycle balances...";
        row.appendChild(cell);
        balanceElements.bodyElement.appendChild(row);
        return;
      }

      balanceElements.selectionMessageElement.textContent = selectedCycle
        ? `Managing balances for cycle #${selectedCycleID} (${selectedCycle.closing_date} → ${selectedCycle.due_date})`
        : `Managing balances for cycle #${selectedCycleID}`;
      balanceElements.formElement.hidden = false;

      if (balances.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 5;
        cell.textContent = "No cycle balances yet";
        row.appendChild(cell);
        balanceElements.bodyElement.appendChild(row);
        return;
      }

      for (const balance of balances) {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${balance.id}</td>
          <td>${escapeHtml(formatCurrencyLabel(balance.currency_id))}</td>
          <td>${escapeHtml(balance.balance)}</td>
          <td>${balance.paid ? "Yes" : "No"}</td>
          <td>
            <button type="button" data-balance-action="edit" data-id="${balance.id}">Edit</button>
            <button type="button" data-balance-action="delete" data-id="${balance.id}">Delete</button>
          </td>
        `;
        balanceElements.bodyElement.appendChild(row);
      }

      balanceElements.bodyElement.querySelectorAll("button").forEach((button) => {
        button.addEventListener("click", onBalanceRowAction);
      });
    }

    async function loadBalancesForSelectedCycle() {
      if (!selectedCycleID) {
        setCreditCardCycleBalances([]);
        isLoadingBalances = false;
        renderBalances();
        return;
      }

      setCreditCardCycleBalances([]);
      isLoadingBalances = true;
      renderBalances();

      try {
        const balances = await apiRequest(`/api/credit-card-cycles/${selectedCycleID}/balances`, { method: "GET" });
        setCreditCardCycleBalances(balances);
        balanceElements.cycleIdElement.value = String(selectedCycleID);
        populateBalanceCurrencyOptions();
      } catch (error) {
        setBalanceMessage(error.message, true);
      } finally {
        isLoadingBalances = false;
        renderBalances();
      }
    }

    function populateCreditCardOptions() {
      const selectedValue = elements.creditCardIdElement.value;
      elements.creditCardIdElement.innerHTML = "";

      const defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.textContent = "Select credit card";
      elements.creditCardIdElement.appendChild(defaultOption);

      for (const creditCard of getCreditCards()) {
        const option = document.createElement("option");
        option.value = String(creditCard.id);
        option.textContent = formatCreditCardLabel(creditCard.id);
        elements.creditCardIdElement.appendChild(option);
      }

      elements.creditCardIdElement.value = selectedValue;
    }

    async function load() {
      try {
        const cycles = await apiRequest("/api/credit-card-cycles", { method: "GET" });
        setCreditCardCycles(cycles);
        populateCreditCardOptions();
        render();

        if (selectedCycleID) {
          await loadBalancesForSelectedCycle();
        } else {
          resetBalanceForm();
          renderBalances();
        }
      } catch (error) {
        setMessage(error.message, true);
      }
    }

    async function onSubmit(event) {
      event.preventDefault();

      const id = elements.idElement.value.trim();
      const payload = normalizeCreditCardCycleInput(
        elements.creditCardIdElement.value,
        elements.closingDateElement.value,
        elements.dueDateElement.value
      );

      if (payload.due_date < payload.closing_date) {
        setMessage("due_date must be on or after closing_date", true);
        return;
      }

      try {
        if (id) {
          await apiRequest(`/api/credit-card-cycles/${id}`, {
            method: "PUT",
            body: JSON.stringify(payload),
          });
          setMessage("Credit card cycle updated", false);
        } else {
          await apiRequest("/api/credit-card-cycles", {
            method: "POST",
            body: JSON.stringify(payload),
          });
          setMessage("Credit card cycle created", false);
        }

        resetForm();
        await load();
      } catch (error) {
        setMessage(error.message, true);
      }
    }

    async function deleteCreditCardCycle(id) {
      try {
        await apiRequest(`/api/credit-card-cycles/${id}`, { method: "DELETE" });
        setMessage("Credit card cycle deleted", false);
        if (selectedCycleID === id) {
          selectedCycleID = null;
          setCreditCardCycleBalances([]);
          resetBalanceForm();
          renderBalances();
        }
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

      const cycle = getCreditCardCycles().find((item) => String(item.id) === id);
      if (!cycle) {
        return;
      }

      if (action === "edit") {
        elements.idElement.value = String(cycle.id);
        elements.creditCardIdElement.value = String(cycle.credit_card_id);
        elements.closingDateElement.value = cycle.closing_date;
        elements.dueDateElement.value = cycle.due_date;
        elements.submitButtonElement.textContent = "Update";
        elements.cancelButtonElement.hidden = false;
        setMessage(`Editing credit card cycle #${cycle.id}`, false);
        return;
      }

      if (action === "delete") {
        deleteCreditCardCycle(cycle.id);
        return;
      }

      if (action === "balances") {
        selectedCycleID = cycle.id;
        resetBalanceForm();
        renderBalances();
        loadBalancesForSelectedCycle();
      }
    }

    async function onBalanceSubmit(event) {
      event.preventDefault();

      if (!selectedCycleID) {
        setBalanceMessage("Select a cycle first", true);
        return;
      }

      const id = balanceElements.idElement.value.trim();
      const payload = normalizeCreditCardCycleBalanceInput(
        balanceElements.cycleIdElement.value,
        balanceElements.currencyIdElement.value,
        balanceElements.balanceElement.value,
        balanceElements.paidElement.checked
      );

      const hasDuplicateCurrency = getCreditCardCycleBalances().some((item) => {
        if (id && String(item.id) === id) {
          return false;
        }

        return item.currency_id === payload.currency_id;
      });

      if (hasDuplicateCurrency) {
        setBalanceMessage("A balance with this currency already exists for the selected cycle", true);
        return;
      }

      try {
        if (id) {
          await apiRequest(`/api/credit-card-cycles/${selectedCycleID}/balances/${id}`, {
            method: "PUT",
            body: JSON.stringify(payload),
          });
          setBalanceMessage("Credit card cycle balance updated", false);
        } else {
          await apiRequest(`/api/credit-card-cycles/${selectedCycleID}/balances`, {
            method: "POST",
            body: JSON.stringify(payload),
          });
          setBalanceMessage("Credit card cycle balance created", false);
        }

        resetBalanceForm();
        await loadBalancesForSelectedCycle();
      } catch (error) {
        setBalanceMessage(error.message, true);
      }
    }

    async function deleteBalance(balanceID) {
      if (!selectedCycleID) {
        return;
      }

      try {
        await apiRequest(`/api/credit-card-cycles/${selectedCycleID}/balances/${balanceID}`, { method: "DELETE" });
        setBalanceMessage("Credit card cycle balance deleted", false);
        resetBalanceForm();
        await loadBalancesForSelectedCycle();
      } catch (error) {
        setBalanceMessage(error.message, true);
      }
    }

    function onBalanceRowAction(event) {
      const action = event.target.getAttribute("data-balance-action");
      const id = event.target.getAttribute("data-id");
      if (!id) {
        return;
      }

      const balance = getCreditCardCycleBalances().find((item) => String(item.id) === id);
      if (!balance) {
        return;
      }

      if (action === "edit") {
        balanceElements.idElement.value = String(balance.id);
        balanceElements.cycleIdElement.value = String(balance.credit_card_cycle_id);
        balanceElements.currencyIdElement.value = String(balance.currency_id);
        balanceElements.balanceElement.value = String(balance.balance);
        balanceElements.paidElement.checked = Boolean(balance.paid);
        balanceElements.submitButtonElement.textContent = "Update";
        balanceElements.cancelButtonElement.hidden = false;
        setBalanceMessage(`Editing balance #${balance.id}`, false);
        return;
      }

      if (action === "delete") {
        deleteBalance(balance.id);
      }
    }

    return {
      load,
      render,
      renderBalances,
      onSubmit,
      onRowAction,
      resetForm,
      onBalanceSubmit,
      resetBalanceForm,
      setMessage,
      populateCreditCardOptions,
      populateBalanceCurrencyOptions,
    };
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { createCreditCardCyclesModule };
    return;
  }

  globalScope.createCreditCardCyclesModule = createCreditCardCyclesModule;
})(typeof globalThis !== "undefined" ? globalThis : window);
