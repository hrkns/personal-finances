/**
 * Expenses feature module.
 *
 * Analogy:
 * - React: behaves like a feature hook + CRUD table/form pair.
 * - Angular: similar to a smart component backed by a service.
 * - Vue: similar to a domain composable driving a template section.
 */
(function initExpensesModule(globalScope) {
  /**
   * Creates the expenses controller for CRUD UI interactions.
   *
   * @param {{
   *   elements: object,
   *   apiRequest: (url: string, options?: RequestInit) => Promise<any>,
   *   normalizeExpenseInput: (name: string, frequency: string) => object,
   *   escapeHtml: (value: any) => string,
   *   getExpenses: () => any[],
   *   setExpenses: (items: any[]) => void
   * }} config
   * @returns {{load: Function, render: Function, onSubmit: Function, onRowAction: Function, resetForm: Function, setMessage: Function}}
   */
  function createExpensesModule(config) {
    const {
      elements,
      apiRequest,
      normalizeExpenseInput,
      escapeHtml,
      getExpenses,
      setExpenses,
      onExpensesChanged = () => {},
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

    function render() {
      const expenses = getExpenses();
      elements.bodyElement.innerHTML = "";

      if (expenses.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 4;
        cell.textContent = "No expenses yet";
        row.appendChild(cell);
        elements.bodyElement.appendChild(row);
        return;
      }

      for (const expense of expenses) {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${expense.id}</td>
          <td>${escapeHtml(expense.name)}</td>
          <td>${escapeHtml(expense.frequency)}</td>
          <td>
            <button type="button" data-action="edit" data-id="${expense.id}">Edit</button>
            <button type="button" data-action="delete" data-id="${expense.id}">Delete</button>
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
        const expenses = await apiRequest("/api/expenses", { method: "GET" });
        setExpenses(expenses);
        render();
        onExpensesChanged();
      } catch (error) {
        setMessage(error.message, true);
      }
    }

    async function onSubmit(event) {
      event.preventDefault();

      const id = elements.idElement.value.trim();
      const payload = normalizeExpenseInput(elements.nameElement.value, elements.frequencyElement.value);

      try {
        if (id) {
          await apiRequest(`/api/expenses/${id}`, {
            method: "PUT",
            body: JSON.stringify(payload),
          });
          setMessage("Expense updated", false);
        } else {
          await apiRequest("/api/expenses", {
            method: "POST",
            body: JSON.stringify(payload),
          });
          setMessage("Expense created", false);
        }

        resetForm();
        await load();
      } catch (error) {
        setMessage(error.message, true);
      }
    }

    async function deleteExpense(id) {
      try {
        await apiRequest(`/api/expenses/${id}`, { method: "DELETE" });
        setMessage("Expense deleted", false);
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

      const expense = getExpenses().find((item) => String(item.id) === id);
      if (!expense) {
        return;
      }

      if (action === "edit") {
        elements.idElement.value = String(expense.id);
        elements.nameElement.value = expense.name;
        elements.frequencyElement.value = expense.frequency;
        elements.submitButtonElement.textContent = "Update";
        elements.cancelButtonElement.hidden = false;
        setMessage(`Editing expense #${expense.id}`, false);
        return;
      }

      if (action === "delete") {
        deleteExpense(expense.id);
      }
    }

    return {
      load,
      render,
      onSubmit,
      onRowAction,
      resetForm,
      setMessage,
    };
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { createExpensesModule };
    return;
  }

  globalScope.createExpensesModule = createExpensesModule;
})(typeof globalThis !== "undefined" ? globalThis : window);
