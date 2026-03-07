/**
 * Expense Payments feature module.
 *
 * Analogy:
 * - React: behaves like a CRUD container with client-side period validation.
 * - Angular: similar to a smart form/table component with dependent selects.
 * - Vue: similar to a composable-backed management section.
 */
(function initExpensePaymentsModule(globalScope) {
  function createExpensePaymentsModule(config) {
    const {
      elements,
      apiRequest,
      normalizeExpensePaymentInput,
      isValidISODate,
      escapeHtml,
      getExpenses,
      getCurrencies,
      getExpensePayments,
      setExpensePayments,
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
      populateExpenseOptions();
      populateCurrencyOptions();
    }

    function formatExpenseLabel(expenseID) {
      const expense = getExpenses().find((item) => item.id === expenseID);
      if (!expense) {
        return `#${expenseID}`;
      }

      return `${expense.name} (${expense.frequency})`;
    }

    function formatCurrencyLabel(currencyID) {
      const currency = getCurrencies().find((item) => item.id === currencyID);
      if (!currency) {
        return `#${currencyID}`;
      }

      return `${currency.code} (${currency.name})`;
    }

    function render() {
      const expensePayments = getExpensePayments();
      elements.bodyElement.innerHTML = "";

      if (expensePayments.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 6;
        cell.textContent = "No expense payments yet";
        row.appendChild(cell);
        elements.bodyElement.appendChild(row);
        return;
      }

      for (const payment of expensePayments) {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${payment.id}</td>
          <td>${escapeHtml(formatExpenseLabel(payment.expense_id))}</td>
          <td>${escapeHtml(Number(payment.amount).toFixed(2))}</td>
          <td>${escapeHtml(formatCurrencyLabel(payment.currency_id))}</td>
          <td>${escapeHtml(payment.date)}</td>
          <td>
            <button type="button" data-action="edit" data-id="${payment.id}">Edit</button>
            <button type="button" data-action="delete" data-id="${payment.id}">Delete</button>
          </td>
        `;
        elements.bodyElement.appendChild(row);
      }

      elements.bodyElement.querySelectorAll("button").forEach((button) => {
        button.addEventListener("click", onRowAction);
      });
    }

    function populateExpenseOptions() {
      const selectedValue = elements.expenseIdElement.value;
      elements.expenseIdElement.innerHTML = "";

      const defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.textContent = "Select expense";
      elements.expenseIdElement.appendChild(defaultOption);

      for (const expense of getExpenses()) {
        const option = document.createElement("option");
        option.value = String(expense.id);
        option.textContent = `${expense.name} (${expense.frequency})`;
        elements.expenseIdElement.appendChild(option);
      }

      elements.expenseIdElement.value = selectedValue;
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
        option.textContent = `${currency.code} (${currency.name})`;
        elements.currencyIdElement.appendChild(option);
      }

      elements.currencyIdElement.value = selectedValue;
    }

    function getISOWeekParts(dateValue) {
      const date = new Date(`${dateValue}T00:00:00Z`);
      const day = date.getUTCDay() || 7;
      date.setUTCDate(date.getUTCDate() + 4 - day);
      const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
      const week = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
      return { year: date.getUTCFullYear(), week };
    }

    function buildPeriodKey(dateValue, frequency) {
      const [year, month, day] = dateValue.split("-");

      if (frequency === "daily") {
        return `${year}-${month}-${day}`;
      }

      if (frequency === "weekly") {
        const weekParts = getISOWeekParts(dateValue);
        return `${weekParts.year}-W${String(weekParts.week).padStart(2, "0")}`;
      }

      if (frequency === "monthly") {
        return `${year}-${month}`;
      }

      return year;
    }

    function hasPaymentInSamePeriod(payload, currentID) {
      const expense = getExpenses().find((item) => item.id === payload.expense_id);
      if (!expense) {
        return false;
      }

      const payloadPeriodKey = buildPeriodKey(payload.date, expense.frequency);

      return getExpensePayments().some((item) => {
        if (currentID && item.id === currentID) {
          return false;
        }
        if (item.expense_id !== payload.expense_id) {
          return false;
        }

        return buildPeriodKey(item.date, expense.frequency) === payloadPeriodKey;
      });
    }

    function validatePayload(payload, id) {
      if (!Number.isInteger(payload.expense_id) || payload.expense_id <= 0) {
        return "expense_id must be a positive integer";
      }
      if (!(payload.amount > 0)) {
        return "amount must be greater than zero";
      }
      if (!Number.isInteger(payload.currency_id) || payload.currency_id <= 0) {
        return "currency_id must be a positive integer";
      }
      if (!isValidISODate(payload.date)) {
        return "date must be a valid date in YYYY-MM-DD format";
      }

      const expense = getExpenses().find((item) => item.id === payload.expense_id);
      const currency = getCurrencies().find((item) => item.id === payload.currency_id);
      if (!expense || !currency) {
        return "expense and currency must exist";
      }

      if (hasPaymentInSamePeriod(payload, id)) {
        return `an expense payment already exists in the same ${expense.frequency} period`;
      }

      return null;
    }

    async function load() {
      try {
        const payments = await apiRequest("/api/expense-payments", { method: "GET" });
        setExpensePayments(payments);
        populateExpenseOptions();
        populateCurrencyOptions();
        render();
      } catch (error) {
        setMessage(error.message, true);
      }
    }

    async function onSubmit(event) {
      event.preventDefault();

      const idRaw = elements.idElement.value.trim();
      const id = idRaw ? Number(idRaw) : null;
      const payload = normalizeExpensePaymentInput(
        elements.expenseIdElement.value,
        elements.amountElement.value,
        elements.currencyIdElement.value,
        elements.dateElement.value
      );

      const validationMessage = validatePayload(payload, id);
      if (validationMessage) {
        setMessage(validationMessage, true);
        return;
      }

      try {
        if (idRaw) {
          await apiRequest(`/api/expense-payments/${idRaw}`, {
            method: "PUT",
            body: JSON.stringify(payload),
          });
          setMessage("Expense payment updated", false);
        } else {
          await apiRequest("/api/expense-payments", {
            method: "POST",
            body: JSON.stringify(payload),
          });
          setMessage("Expense payment created", false);
        }

        resetForm();
        await load();
      } catch (error) {
        setMessage(error.message, true);
      }
    }

    async function deleteExpensePayment(id) {
      try {
        await apiRequest(`/api/expense-payments/${id}`, { method: "DELETE" });
        setMessage("Expense payment deleted", false);
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

      const payment = getExpensePayments().find((item) => String(item.id) === id);
      if (!payment) {
        return;
      }

      if (action === "edit") {
        elements.idElement.value = String(payment.id);
        elements.expenseIdElement.value = String(payment.expense_id);
        elements.amountElement.value = String(payment.amount);
        elements.currencyIdElement.value = String(payment.currency_id);
        elements.dateElement.value = payment.date;
        elements.submitButtonElement.textContent = "Update";
        elements.cancelButtonElement.hidden = false;
        setMessage(`Editing expense payment #${payment.id}`, false);
        return;
      }

      if (action === "delete") {
        deleteExpensePayment(payment.id);
      }
    }

    return {
      load,
      render,
      onSubmit,
      onRowAction,
      resetForm,
      setMessage,
      populateExpenseOptions,
      populateCurrencyOptions,
    };
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { createExpensePaymentsModule };
    return;
  }

  globalScope.createExpensePaymentsModule = createExpensePaymentsModule;
})(typeof globalThis !== "undefined" ? globalThis : window);
