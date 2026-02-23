(function initCreditCardsModule(globalScope) {
  function createCreditCardsModule(config) {
    const {
      elements,
      apiRequest,
      normalizeCreditCardInput,
      escapeHtml,
      getBanks,
      getPeople,
      getCurrencies,
      getCreditCards,
      setCreditCards,
    } = config;

    let managingCurrenciesCreditCardID = null;

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
        cell.colSpan = 7;
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
          <td>${escapeHtml(formatCurrencyLabels(creditCard.currency_ids || []))}</td>
          <td>
            <button type="button" data-action="edit" data-id="${creditCard.id}">Edit</button>
            <button type="button" data-action="delete" data-id="${creditCard.id}">Delete</button>
            <button type="button" data-action="manage-currencies" data-id="${creditCard.id}">Manage Currencies</button>
          </td>
        `;
        elements.bodyElement.appendChild(row);

        if (managingCurrenciesCreditCardID === creditCard.id) {
          const managerRow = renderCurrenciesManagerRow(creditCard);
          elements.bodyElement.appendChild(managerRow);
        }
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
        if (managingCurrenciesCreditCardID === id) {
          managingCurrenciesCreditCardID = null;
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
        return;
      }

      if (action === "manage-currencies") {
        managingCurrenciesCreditCardID = creditCard.id;
        render();
        setMessage(`Managing currencies for credit card #${creditCard.id}`, false);
        return;
      }

      if (action === "cancel-currencies") {
        managingCurrenciesCreditCardID = null;
        render();
        return;
      }

      if (action === "save-currencies") {
        saveCreditCardCurrencies(creditCard.id);
      }
    }

    function getCurrencyLabel(currencyID) {
      const currency = getCurrencies().find((item) => item.id === currencyID);
      if (!currency) {
        return `#${currencyID}`;
      }

      return `${currency.code}`;
    }

    function formatCurrencyLabels(currencyIDs) {
      if (!currencyIDs || currencyIDs.length === 0) {
        return "—";
      }

      return currencyIDs.map((currencyID) => getCurrencyLabel(currencyID)).join(", ");
    }

    function renderCurrenciesManagerRow(creditCard) {
      const row = document.createElement("tr");
      row.className = "credit-card-currencies-row";

      const cell = document.createElement("td");
      cell.colSpan = 7;

      const wrapper = document.createElement("div");
      wrapper.className = "actions";

      const title = document.createElement("strong");
      title.textContent = "Currencies:";
      wrapper.appendChild(title);

      const select = document.createElement("select");
      select.multiple = true;
      select.size = Math.max(4, getCurrencies().length);
      select.setAttribute("data-role", "currency-select");
      select.setAttribute("data-credit-card-id", String(creditCard.id));

      const selectedCurrencyIDs = new Set((creditCard.currency_ids || []).map((item) => Number(item)));

      for (const currency of getCurrencies()) {
        const option = document.createElement("option");
        option.value = String(currency.id);
        option.textContent = `${currency.code} - ${currency.name}`;
        option.selected = selectedCurrencyIDs.has(currency.id);
        select.appendChild(option);
      }

      const saveButton = document.createElement("button");
      saveButton.type = "button";
      saveButton.textContent = "Save Currencies";
      saveButton.setAttribute("data-action", "save-currencies");
      saveButton.setAttribute("data-id", String(creditCard.id));

      const cancelButton = document.createElement("button");
      cancelButton.type = "button";
      cancelButton.textContent = "Cancel";
      cancelButton.setAttribute("data-action", "cancel-currencies");
      cancelButton.setAttribute("data-id", String(creditCard.id));

      wrapper.appendChild(select);
      wrapper.appendChild(saveButton);
      wrapper.appendChild(cancelButton);

      cell.appendChild(wrapper);
      row.appendChild(cell);
      return row;
    }

    async function saveCreditCardCurrencies(creditCardID) {
      const selectElement = elements.bodyElement.querySelector(
        `select[data-role="currency-select"][data-credit-card-id="${creditCardID}"]`
      );
      if (!selectElement) {
        return;
      }

      const selectedCurrencyIDs = [...selectElement.selectedOptions]
        .map((option) => Number.parseInt(option.value, 10))
        .filter((value) => Number.isInteger(value) && value > 0);

      if (selectedCurrencyIDs.length === 0) {
        setMessage("Select at least one currency", true);
        return;
      }

      try {
        await apiRequest(`/api/credit-cards/${creditCardID}/currencies`, {
          method: "PUT",
          body: JSON.stringify({ currency_ids: selectedCurrencyIDs }),
        });

        setMessage("Credit card currencies updated", false);
        managingCurrenciesCreditCardID = null;
        await load();
      } catch (error) {
        setMessage(error.message, true);
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
      saveCreditCardCurrencies,
    };
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { createCreditCardsModule };
    return;
  }

  globalScope.createCreditCardsModule = createCreditCardsModule;
})(typeof globalThis !== "undefined" ? globalThis : window);
