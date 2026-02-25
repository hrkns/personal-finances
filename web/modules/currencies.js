/**
 * Currencies feature module.
 *
 * Analogy:
 * - React: behaves like a feature hook + presentational table/form pair.
 * - Angular: similar to a smart component backed by a service.
 * - Vue: similar to a domain composable driving a template section.
 */
(function initCurrenciesModule(globalScope) {
  /**
   * Creates the currencies controller for CRUD UI interactions.
   *
   * @param {{
   *   elements: object,
   *   apiRequest: (url: string, options?: RequestInit) => Promise<any>,
   *   normalizeCurrencyInput: (name: string, code: string) => object,
   *   escapeHtml: (value: any) => string,
   *   getCurrencies: () => any[],
   *   setCurrencies: (items: any[]) => void,
   *   onCurrenciesChanged?: () => void
   * }} config
   * @returns {{load: Function, render: Function, onSubmit: Function, onRowAction: Function, resetForm: Function, setMessage: Function}}
   */
  function createCurrenciesModule(config) {
    const {
      elements,
      apiRequest,
      normalizeCurrencyInput,
      escapeHtml,
      getCurrencies,
      setCurrencies,
      onCurrenciesChanged,
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
      const currencies = getCurrencies();
      elements.bodyElement.innerHTML = "";

      if (currencies.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 4;
        cell.textContent = "No currencies yet";
        row.appendChild(cell);
        elements.bodyElement.appendChild(row);
        return;
      }

      for (const currency of currencies) {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${currency.id}</td>
          <td>${escapeHtml(currency.name)}</td>
          <td>${escapeHtml(currency.code)}</td>
          <td>
            <button type="button" data-action="edit" data-id="${currency.id}">Edit</button>
            <button type="button" data-action="delete" data-id="${currency.id}">Delete</button>
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
        const currencies = await apiRequest("/api/currencies", { method: "GET" });
        setCurrencies(currencies);
        render();
        if (onCurrenciesChanged) {
          onCurrenciesChanged();
        }
      } catch (error) {
        setMessage(error.message, true);
      }
    }

    async function onSubmit(event) {
      event.preventDefault();

      const id = elements.idElement.value.trim();
      const payload = normalizeCurrencyInput(elements.nameElement.value, elements.codeElement.value);

      try {
        if (id) {
          await apiRequest(`/api/currencies/${id}`, {
            method: "PUT",
            body: JSON.stringify(payload),
          });
          setMessage("Currency updated", false);
        } else {
          await apiRequest("/api/currencies", {
            method: "POST",
            body: JSON.stringify(payload),
          });
          setMessage("Currency created", false);
        }

        resetForm();
        await load();
      } catch (error) {
        setMessage(error.message, true);
      }
    }

    async function deleteCurrency(id) {
      try {
        await apiRequest(`/api/currencies/${id}`, { method: "DELETE" });
        setMessage("Currency deleted", false);
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

      const currency = getCurrencies().find((item) => String(item.id) === id);
      if (!currency) {
        return;
      }

      if (action === "edit") {
        elements.idElement.value = String(currency.id);
        elements.nameElement.value = currency.name;
        elements.codeElement.value = currency.code;
        elements.submitButtonElement.textContent = "Update";
        elements.cancelButtonElement.hidden = false;
        setMessage(`Editing currency #${currency.id}`, false);
        return;
      }

      if (action === "delete") {
        deleteCurrency(currency.id);
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
    module.exports = { createCurrenciesModule };
    return;
  }

  globalScope.createCurrenciesModule = createCurrenciesModule;
})(typeof globalThis !== "undefined" ? globalThis : window);
