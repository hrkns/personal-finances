(function initCreditCardsModule(globalScope) {
  function createCreditCardsModule(config) {
    const {
      elements,
      apiRequest,
      normalizeCreditCardInput,
      escapeHtml,
      getBanks,
      getPeople,
      getCreditCards,
      setCreditCards,
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
      populateBankOptions();
      populatePersonOptions();
    }

    function formatBankLabel(bankID) {
      const bank = getBanks().find((item) => item.id === bankID);
      if (!bank) {
        return `#${bankID}`;
      }

      return `${bank.name} (${bank.country})`;
    }

    function formatPersonLabel(personID) {
      const person = getPeople().find((item) => item.id === personID);
      if (!person) {
        return `#${personID}`;
      }

      return person.name;
    }

    function render() {
      const creditCards = getCreditCards();
      elements.bodyElement.innerHTML = "";

      if (creditCards.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 6;
        cell.textContent = "No credit cards yet";
        row.appendChild(cell);
        elements.bodyElement.appendChild(row);
        return;
      }

      for (const creditCard of creditCards) {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${creditCard.id}</td>
          <td>${escapeHtml(formatBankLabel(creditCard.bank_id))}</td>
          <td>${escapeHtml(formatPersonLabel(creditCard.person_id))}</td>
          <td>${escapeHtml(creditCard.number)}</td>
          <td>${escapeHtml(creditCard.name || "—")}</td>
          <td>
            <button type="button" data-action="edit" data-id="${creditCard.id}">Edit</button>
            <button type="button" data-action="delete" data-id="${creditCard.id}">Delete</button>
          </td>
        `;
        elements.bodyElement.appendChild(row);
      }

      elements.bodyElement.querySelectorAll("button").forEach((button) => {
        button.addEventListener("click", onRowAction);
      });
    }

    function populateBankOptions() {
      const selectedValue = elements.bankIdElement.value;
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

      elements.bankIdElement.value = selectedValue;
    }

    function populatePersonOptions() {
      const selectedValue = elements.personIdElement.value;
      elements.personIdElement.innerHTML = "";

      const defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.textContent = "Select person";
      elements.personIdElement.appendChild(defaultOption);

      for (const person of getPeople()) {
        const option = document.createElement("option");
        option.value = String(person.id);
        option.textContent = `${person.name} (#${person.id})`;
        elements.personIdElement.appendChild(option);
      }

      elements.personIdElement.value = selectedValue;
    }

    async function load() {
      try {
        const creditCards = await apiRequest("/api/credit-cards", { method: "GET" });
        setCreditCards(creditCards);
        populateBankOptions();
        populatePersonOptions();
        render();
      } catch (error) {
        setMessage(error.message, true);
      }
    }

    async function onSubmit(event) {
      event.preventDefault();

      const id = elements.idElement.value.trim();
      const payload = normalizeCreditCardInput(
        elements.bankIdElement.value,
        elements.personIdElement.value,
        elements.numberElement.value,
        elements.nameElement.value
      );

      try {
        if (id) {
          await apiRequest(`/api/credit-cards/${id}`, {
            method: "PUT",
            body: JSON.stringify(payload),
          });
          setMessage("Credit card updated", false);
        } else {
          await apiRequest("/api/credit-cards", {
            method: "POST",
            body: JSON.stringify(payload),
          });
          setMessage("Credit card created", false);
        }

        resetForm();
        await load();
      } catch (error) {
        setMessage(error.message, true);
      }
    }

    async function deleteCreditCard(id) {
      try {
        await apiRequest(`/api/credit-cards/${id}`, { method: "DELETE" });
        setMessage("Credit card deleted", false);
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

      const creditCard = getCreditCards().find((item) => String(item.id) === id);
      if (!creditCard) {
        return;
      }

      if (action === "edit") {
        elements.idElement.value = String(creditCard.id);
        elements.bankIdElement.value = String(creditCard.bank_id);
        elements.personIdElement.value = String(creditCard.person_id);
        elements.numberElement.value = creditCard.number;
        elements.nameElement.value = creditCard.name || "";
        elements.submitButtonElement.textContent = "Update";
        elements.cancelButtonElement.hidden = false;
        setMessage(`Editing credit card #${creditCard.id}`, false);
        return;
      }

      if (action === "delete") {
        deleteCreditCard(creditCard.id);
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
      populatePersonOptions,
    };
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { createCreditCardsModule };
    return;
  }

  globalScope.createCreditCardsModule = createCreditCardsModule;
})(typeof globalThis !== "undefined" ? globalThis : window);
