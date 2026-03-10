/**
 * Credit Card Cycles feature module.
 */
(function initCreditCardCyclesModule(globalScope) {
  /**
   * @param {{
   *   elements: object,
   *   apiRequest: (url: string, options?: RequestInit) => Promise<any>,
   *   normalizeCreditCardCycleInput: Function,
   *   escapeHtml: (value: any) => string,
   *   getCreditCards: () => any[],
   *   getCreditCardCycles: () => any[],
   *   setCreditCardCycles: (items: any[]) => void,
   *   generateActionsCell: (item: any) => string
   * }} config
   */
  function createCreditCardCyclesModule(config) {
    const {
      elements,
      apiRequest,
      normalizeCreditCardCycleInput,
      escapeHtml,
      getCreditCards,
      getCreditCardCycles,
      setCreditCardCycles,
      generateActionsCell,
    } = config;

    const bootstrapModal = globalScope.bootstrap?.Modal;
    const hasModalSupport = Boolean(bootstrapModal && elements.modalElement);
    const modalInstance = hasModalSupport ? bootstrapModal.getOrCreateInstance(elements.modalElement) : null;
    let modalBindingsInitialized = false;

    function setMessage(message, isError) {
      elements.messageElement.textContent = message;
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

    function resetForm() {
      elements.formElement.reset();
      elements.idElement.value = "";
      elements.submitButtonElement.textContent = "Create";
      elements.cancelButtonElement.hidden = true;
      populateCreditCardOptions();
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
          ${generateActionsCell(cycle)}
        `;
        elements.bodyElement.appendChild(row);
      }

      elements.bodyElement.querySelectorAll("button").forEach((button) => {
        button.addEventListener("click", onRowAction);
      });
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
      initializeModalBindings();

      try {
        const cycles = await apiRequest("/api/credit-card-cycles", { method: "GET" });
        setCreditCardCycles(cycles);
        populateCreditCardOptions();
        render();
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

        hideModal();
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
        if (elements.modalTitleElement) {
          elements.modalTitleElement.textContent = "Edit credit card cycle";
        }
        showModal();
        setMessage(`Editing credit card cycle #${cycle.id}`, false);
        return;
      }

      if (action === "delete") {
        deleteCreditCardCycle(cycle.id);
      }
    }

    return {
      load,
      render,
      onSubmit,
      onRowAction,
      resetForm,
      setMessage,
      populateCreditCardOptions,
    };
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { createCreditCardCyclesModule };
    return;
  }

  globalScope.createCreditCardCyclesModule = createCreditCardCyclesModule;
})(typeof globalThis !== "undefined" ? globalThis : window);
