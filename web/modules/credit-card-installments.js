(function initCreditCardInstallmentsModule(globalScope) {
  function createCreditCardInstallmentsModule(config) {
    const {
      elements,
      apiRequest,
      normalizeCreditCardInstallmentInput,
      escapeHtml,
      getCreditCards,
      getCreditCardInstallments,
      setCreditCardInstallments,
    } = config;

    function setMessage(message, isError) {
      elements.messageElement.textContent = message;
      elements.messageElement.className = isError ? "error" : "success";
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

    function resetForm() {
      elements.formElement.reset();
      elements.idElement.value = "";
      elements.submitButtonElement.textContent = "Create";
      elements.cancelButtonElement.hidden = true;
      populateCreditCardOptions();
    }

    function render() {
      const installments = getCreditCardInstallments();
      elements.bodyElement.innerHTML = "";

      if (installments.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 7;
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
          <td>${escapeHtml(installment.concept)}</td>
          <td>${escapeHtml(installment.amount)}</td>
          <td>${escapeHtml(installment.start_date)}</td>
          <td>${escapeHtml(installment.count)}</td>
          <td>
            <button type="button" data-action="edit" data-id="${installment.id}">Edit</button>
            <button type="button" data-action="delete" data-id="${installment.id}">Delete</button>
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
        const installments = await apiRequest("/api/credit-card-installments", { method: "GET" });
        setCreditCardInstallments(installments);
        populateCreditCardOptions();
        render();
      } catch (error) {
        setMessage(error.message, true);
      }
    }

    function hasDuplicateCardConcept(payload, id) {
      return getCreditCardInstallments().some((item) => {
        if (id && String(item.id) === id) {
          return false;
        }

        return item.credit_card_id === payload.credit_card_id && item.concept === payload.concept;
      });
    }

    async function onSubmit(event) {
      event.preventDefault();

      const id = elements.idElement.value.trim();
      const payload = normalizeCreditCardInstallmentInput(
        elements.creditCardIdElement.value,
        elements.conceptElement.value,
        elements.amountElement.value,
        elements.startDateElement.value,
        elements.countElement.value
      );

      if (hasDuplicateCardConcept(payload, id)) {
        setMessage("A credit card installment with this concept already exists for the selected credit card", true);
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
        elements.conceptElement.value = installment.concept;
        elements.amountElement.value = String(installment.amount);
        elements.startDateElement.value = installment.start_date;
        elements.countElement.value = String(installment.count);
        elements.submitButtonElement.textContent = "Update";
        elements.cancelButtonElement.hidden = false;
        setMessage(`Editing credit card installment #${installment.id}`, false);
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
    };
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { createCreditCardInstallmentsModule };
    return;
  }

  globalScope.createCreditCardInstallmentsModule = createCreditCardInstallmentsModule;
})(typeof globalThis !== "undefined" ? globalThis : window);
