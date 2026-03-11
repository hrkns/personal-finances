/**
 * Credit Card Subscriptions feature module.
 *
 * Analogy:
 * - React: comparable to a CRUD slice/controller for recurring charges.
 * - Angular/Vue: similar to a feature component/composable with dependent selects.
 */
(function initCreditCardSubscriptionsModule(globalScope) {
  /**
   * Creates subscriptions controller with CRUD and card/currency lookup rendering.
   *
   * @param {{
   *   elements: object,
   *   apiRequest: (url: string, options?: RequestInit) => Promise<any>,
   *   normalizeCreditCardSubscriptionInput: Function,
   *   escapeHtml: (value: any) => string,
   *   getCreditCards: () => any[],
   *   getCurrencies: () => any[],
   *   getCreditCardSubscriptions: () => any[],
   *   setCreditCardSubscriptions: (items: any[]) => void,
   *   generateActionsCell: (item: any) => string
   * }} config
   * @returns {{load: Function, render: Function, onSubmit: Function, onRowAction: Function, resetForm: Function, setMessage: Function, populateCreditCardOptions: Function, populateCurrencyOptions: Function}}
   */
  function createCreditCardSubscriptionsModule(config) {
    const {
      elements,
      apiRequest,
      normalizeCreditCardSubscriptionInput,
      escapeHtml,
      getCreditCards,
      getCurrencies,
      getCreditCardSubscriptions,
      setCreditCardSubscriptions,
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

    function formatCurrencyLabel(currencyID) {
      const currency = getCurrencies().find((item) => item.id === currencyID);
      if (!currency) {
        return `#${currencyID}`;
      }

      return `${currency.code} (${currency.name})`;
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
      const subscriptions = getCreditCardSubscriptions();
      elements.bodyElement.innerHTML = "";

      if (subscriptions.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 6;
        cell.textContent = "No credit card subscriptions yet";
        row.appendChild(cell);
        elements.bodyElement.appendChild(row);
        return;
      }

      for (const subscription of subscriptions) {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${subscription.id}</td>
          <td>${escapeHtml(formatCreditCardLabel(subscription.credit_card_id))}</td>
          <td>${escapeHtml(formatCurrencyLabel(subscription.currency_id))}</td>
          <td>${escapeHtml(subscription.concept)}</td>
          <td>${escapeHtml(subscription.amount)}</td>
          ${generateActionsCell(subscription)}
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
        const subscriptions = await apiRequest("/api/credit-card-subscriptions", { method: "GET" });
        setCreditCardSubscriptions(subscriptions);
        populateCreditCardOptions();
        populateCurrencyOptions();
        render();
      } catch (error) {
        setMessage(error.message, true);
      }
    }

    function hasDuplicateCardCurrencyConcept(payload, id) {
      return getCreditCardSubscriptions().some((item) => {
        if (id && String(item.id) === id) {
          return false;
        }

        return (
          item.credit_card_id === payload.credit_card_id &&
          item.currency_id === payload.currency_id &&
          item.concept === payload.concept
        );
      });
    }

    async function onSubmit(event) {
      event.preventDefault();

      const id = elements.idElement.value.trim();
      const payload = normalizeCreditCardSubscriptionInput(
        elements.creditCardIdElement.value,
        elements.currencyIdElement.value,
        elements.conceptElement.value,
        elements.amountElement.value
      );

      if (hasDuplicateCardCurrencyConcept(payload, id)) {
        setMessage(
          "A credit card subscription with this concept already exists for the selected credit card and currency",
          true
        );
        return;
      }

      try {
        if (id) {
          await apiRequest(`/api/credit-card-subscriptions/${id}`, {
            method: "PUT",
            body: JSON.stringify(payload),
          });
          setMessage("Credit card subscription updated", false);
        } else {
          await apiRequest("/api/credit-card-subscriptions", {
            method: "POST",
            body: JSON.stringify(payload),
          });
          setMessage("Credit card subscription created", false);
        }

        hideModal();
        resetForm();
        await load();
      } catch (error) {
        setMessage(error.message, true);
      }
    }

    async function deleteCreditCardSubscription(id) {
      try {
        await apiRequest(`/api/credit-card-subscriptions/${id}`, { method: "DELETE" });
        setMessage("Credit card subscription deleted", false);
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

      const subscription = getCreditCardSubscriptions().find((item) => String(item.id) === id);
      if (!subscription) {
        return;
      }

      if (action === "edit") {
        elements.idElement.value = String(subscription.id);
        elements.creditCardIdElement.value = String(subscription.credit_card_id);
        elements.currencyIdElement.value = String(subscription.currency_id);
        elements.conceptElement.value = subscription.concept;
        elements.amountElement.value = String(subscription.amount);
        elements.submitButtonElement.textContent = "Update";
        if (elements.modalTitleElement) {
          elements.modalTitleElement.textContent = "Edit credit card subscription";
        }
        showModal();
        return;
      }

      if (action === "delete") {
        deleteCreditCardSubscription(subscription.id);
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
    module.exports = { createCreditCardSubscriptionsModule };
    return;
  }

  globalScope.createCreditCardSubscriptionsModule = createCreditCardSubscriptionsModule;
})(typeof globalThis !== "undefined" ? globalThis : window);
