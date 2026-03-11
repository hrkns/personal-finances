/**
 * Credit Card Installments feature module.
 *
 * Analogy:
 * - React: comparable to a feature slice with local client-side guards
 *   (duplicate concept per card/currency) before API submission.
 * - Angular/Vue: similar to form logic with synchronous validators plus backend validation.
 */
(function initCreditCardInstallmentsModule(globalScope) {
  /**
   * Creates installments controller with CRUD, card/currency lookups, and duplicate checks.
   *
   * @param {{
   *   elements: object,
   *   apiRequest: (url: string, options?: RequestInit) => Promise<any>,
   *   normalizeCreditCardInstallmentInput: Function,
   *   escapeHtml: (value: any) => string,
   *   getCreditCards: () => any[],
   *   getCurrencies: () => any[],
   *   getCreditCardInstallments: () => any[],
   *   setCreditCardInstallments: (items: any[]) => void,
   *   generateActionsCell: (item: any) => string
   * }} config
   * @returns {{load: Function, render: Function, onSubmit: Function, onRowAction: Function, resetForm: Function, setMessage: Function, populateCreditCardOptions: Function, populateCurrencyOptions: Function}}
   */
  function createCreditCardInstallmentsModule(config) {
    const {
      elements,
      apiRequest,
      normalizeCreditCardInstallmentInput,
      escapeHtml,
      getCreditCards,
      getCurrencies,
      getCreditCardInstallments,
      setCreditCardInstallments,
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

    function formatCurrencyLabel(currencyID) {
      const currency = getCurrencies().find((item) => item.id === currencyID);
      if (!currency) {
        return `#${currencyID}`;
      }

      return `${currency.code} (${currency.name})`;
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

    function resetForm() {
      elements.formElement.reset();
      elements.idElement.value = "";
      elements.submitButtonElement.textContent = "Create";
      elements.cancelButtonElement.hidden = true;
      populateCreditCardOptions();
      populateCurrencyOptions();
    }

    function render() {
      const installments = getCreditCardInstallments();
      elements.bodyElement.innerHTML = "";

      if (installments.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 8;
        cell.textContent = "No credit card installments yet";
        row.appendChild(cell);
        elements.bodyElement.appendChild(row);
        return;
      }

      for (const installment of installments) {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${installment.id}</td>
          <td>${escapeHtml(formatCreditCardLabel(installment.credit_card_id))}</td>
          <td>${escapeHtml(formatCurrencyLabel(installment.currency_id))}</td>
          <td>${escapeHtml(installment.concept)}</td>
          <td>${escapeHtml(installment.amount)}</td>
          <td>${escapeHtml(installment.start_date)}</td>
          <td>${escapeHtml(installment.count)}</td>
          ${generateActionsCell(installment)}
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
        const installments = await apiRequest("/api/credit-card-installments", { method: "GET" });
        setCreditCardInstallments(installments);
        populateCreditCardOptions();
        populateCurrencyOptions();
        render();
      } catch (error) {
        setMessage(error.message, true);
      }
    }

    function hasDuplicateCardCurrencyConcept(payload, id) {
      return getCreditCardInstallments().some((item) => {
        if (id && String(item.id) === id) {
          return false;
        }

        return item.credit_card_id === payload.credit_card_id && item.currency_id === payload.currency_id && item.concept === payload.concept;
      });
    }

    async function onSubmit(event) {
      event.preventDefault();

      const id = elements.idElement.value.trim();
      const payload = normalizeCreditCardInstallmentInput(
        elements.creditCardIdElement.value,
        elements.currencyIdElement.value,
        elements.conceptElement.value,
        elements.amountElement.value,
        elements.startDateElement.value,
        elements.countElement.value
      );

      if (hasDuplicateCardCurrencyConcept(payload, id)) {
        setMessage("A credit card installment with this concept already exists for the selected credit card and currency", true);
        return;
      }

      try {
        if (id) {
          await apiRequest(`/api/credit-card-installments/${id}`, {
            method: "PUT",
            body: JSON.stringify(payload),
          });
          setMessage("Credit card installment updated", false);
        } else {
          await apiRequest("/api/credit-card-installments", {
            method: "POST",
            body: JSON.stringify(payload),
          });
          setMessage("Credit card installment created", false);
        }

        hideModal();
        resetForm();
        await load();
      } catch (error) {
        setMessage(error.message, true);
      }
    }

    async function deleteCreditCardInstallment(id) {
      try {
        await apiRequest(`/api/credit-card-installments/${id}`, { method: "DELETE" });
        setMessage("Credit card installment deleted", false);
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

      const installment = getCreditCardInstallments().find((item) => String(item.id) === id);
      if (!installment) {
        return;
      }

      if (action === "edit") {
        elements.idElement.value = String(installment.id);
        elements.creditCardIdElement.value = String(installment.credit_card_id);
        elements.currencyIdElement.value = String(installment.currency_id);
        elements.conceptElement.value = installment.concept;
        elements.amountElement.value = String(installment.amount);
        elements.startDateElement.value = installment.start_date;
        elements.countElement.value = String(installment.count);
        elements.submitButtonElement.textContent = "Update";
        if (elements.modalTitleElement) {
          elements.modalTitleElement.textContent = "Edit credit card installment";
        }
        showModal();
        return;
      }

      if (action === "delete") {
        deleteCreditCardInstallment(installment.id);
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
      populateCurrencyOptions,
    };
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { createCreditCardInstallmentsModule };
    return;
  }

  globalScope.createCreditCardInstallmentsModule = createCreditCardInstallmentsModule;
})(typeof globalThis !== "undefined" ? globalThis : window);
