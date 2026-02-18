(function initBanksModule(globalScope) {
  function createBanksModule(config) {
    const {
      elements,
      apiRequest,
      normalizeBankInput,
      escapeHtml,
      getBanks,
      setBanks,
      onBanksChanged,
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

    function populateCountryOptions(countries) {
      const orderedCountries = [...countries].sort((left, right) => left.code.localeCompare(right.code));

      for (const country of orderedCountries) {
        const option = document.createElement("option");
        option.value = country.code;
        option.textContent = `${country.code} - ${country.name}`;
        elements.countryElement.appendChild(option);
      }
    }

    async function loadCountryOptions() {
      try {
        const countries = await apiRequest("/api/countries", { method: "GET" });
        populateCountryOptions(countries);
      } catch (error) {
        setMessage(error.message, true);
      }
    }

    function render() {
      const banks = getBanks();
      elements.bodyElement.innerHTML = "";

      if (banks.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 4;
        cell.textContent = "No banks yet";
        row.appendChild(cell);
        elements.bodyElement.appendChild(row);
        return;
      }

      for (const bank of banks) {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${bank.id}</td>
          <td>${escapeHtml(bank.name)}</td>
          <td>${escapeHtml(bank.country)}</td>
          <td>
            <button type="button" data-action="edit" data-id="${bank.id}">Edit</button>
            <button type="button" data-action="delete" data-id="${bank.id}">Delete</button>
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
        const banks = await apiRequest("/api/banks", { method: "GET" });
        setBanks(banks);
        render();
        if (onBanksChanged) {
          onBanksChanged();
        }
      } catch (error) {
        setMessage(error.message, true);
      }
    }

    async function onSubmit(event) {
      event.preventDefault();

      const id = elements.idElement.value.trim();
      const payload = normalizeBankInput(elements.nameElement.value, elements.countryElement.value);

      try {
        if (id) {
          await apiRequest(`/api/banks/${id}`, {
            method: "PUT",
            body: JSON.stringify(payload),
          });
          setMessage("Bank updated", false);
        } else {
          await apiRequest("/api/banks", {
            method: "POST",
            body: JSON.stringify(payload),
          });
          setMessage("Bank created", false);
        }

        resetForm();
        await load();
      } catch (error) {
        setMessage(error.message, true);
      }
    }

    async function deleteBank(id) {
      try {
        await apiRequest(`/api/banks/${id}`, { method: "DELETE" });
        setMessage("Bank deleted", false);
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

      const bank = getBanks().find((item) => String(item.id) === id);
      if (!bank) {
        return;
      }

      if (action === "edit") {
        elements.idElement.value = String(bank.id);
        elements.nameElement.value = bank.name;
        elements.countryElement.value = bank.country;
        elements.submitButtonElement.textContent = "Update";
        elements.cancelButtonElement.hidden = false;
        setMessage(`Editing bank #${bank.id}`, false);
        return;
      }

      if (action === "delete") {
        deleteBank(bank.id);
      }
    }

    return {
      load,
      loadCountryOptions,
      render,
      onSubmit,
      onRowAction,
      resetForm,
      setMessage,
    };
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { createBanksModule };
    return;
  }

  globalScope.createBanksModule = createBanksModule;
})(typeof globalThis !== "undefined" ? globalThis : window);
