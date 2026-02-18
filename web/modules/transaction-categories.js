(function initTransactionCategoriesModule(globalScope) {
  function createTransactionCategoriesModule(config) {
    const {
      elements,
      apiRequest,
      normalizeTransactionCategoryInput,
      escapeHtml,
      getTransactionCategories,
      setTransactionCategories,
      onTransactionCategoriesChanged,
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
      populateParentOptions();
    }

    function render() {
      const categories = getTransactionCategories();
      elements.bodyElement.innerHTML = "";

      if (categories.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 4;
        cell.textContent = "No transaction categories yet";
        row.appendChild(cell);
        elements.bodyElement.appendChild(row);
        return;
      }

      for (const category of categories) {
        const parentLabel = category.parent_name || "—";
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${category.id}</td>
          <td>${escapeHtml(category.name)}</td>
          <td>${escapeHtml(parentLabel)}</td>
          <td>
            <button type="button" data-action="edit" data-id="${category.id}">Edit</button>
            <button type="button" data-action="delete" data-id="${category.id}">Delete</button>
          </td>
        `;
        elements.bodyElement.appendChild(row);
      }

      elements.bodyElement.querySelectorAll("button").forEach((button) => {
        button.addEventListener("click", onRowAction);
      });
    }

    function populateParentOptions(excludeID) {
      const selectedValue = elements.parentIdElement.value;
      elements.parentIdElement.innerHTML = "";

      const defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.textContent = "No parent";
      elements.parentIdElement.appendChild(defaultOption);

      for (const category of getTransactionCategories()) {
        if (excludeID && category.id === excludeID) {
          continue;
        }

        const option = document.createElement("option");
        option.value = String(category.id);
        option.textContent = `${category.name} (#${category.id})`;
        elements.parentIdElement.appendChild(option);
      }

      elements.parentIdElement.value = selectedValue;
    }

    async function load() {
      try {
        const categories = await apiRequest("/api/transaction-categories", { method: "GET" });
        setTransactionCategories(categories);
        populateParentOptions();
        render();
        if (onTransactionCategoriesChanged) {
          onTransactionCategoriesChanged();
        }
      } catch (error) {
        setMessage(error.message, true);
      }
    }

    async function onSubmit(event) {
      event.preventDefault();

      const id = elements.idElement.value.trim();
      const payload = normalizeTransactionCategoryInput(
        elements.nameElement.value,
        elements.parentIdElement.value
      );

      try {
        if (id) {
          await apiRequest(`/api/transaction-categories/${id}`, {
            method: "PUT",
            body: JSON.stringify(payload),
          });
          setMessage("Transaction category updated", false);
        } else {
          await apiRequest("/api/transaction-categories", {
            method: "POST",
            body: JSON.stringify(payload),
          });
          setMessage("Transaction category created", false);
        }

        resetForm();
        await load();
      } catch (error) {
        setMessage(error.message, true);
      }
    }

    async function deleteTransactionCategory(id) {
      try {
        await apiRequest(`/api/transaction-categories/${id}`, { method: "DELETE" });
        setMessage("Transaction category deleted", false);
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

      const category = getTransactionCategories().find((item) => String(item.id) === id);
      if (!category) {
        return;
      }

      if (action === "edit") {
        elements.idElement.value = String(category.id);
        elements.nameElement.value = category.name;
        populateParentOptions(category.id);
        elements.parentIdElement.value = category.parent_id ? String(category.parent_id) : "";
        elements.submitButtonElement.textContent = "Update";
        elements.cancelButtonElement.hidden = false;
        setMessage(`Editing transaction category #${category.id}`, false);
        return;
      }

      if (action === "delete") {
        deleteTransactionCategory(category.id);
      }
    }

    return {
      load,
      render,
      onSubmit,
      onRowAction,
      resetForm,
      setMessage,
      populateParentOptions,
    };
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { createTransactionCategoriesModule };
    return;
  }

  globalScope.createTransactionCategoriesModule = createTransactionCategoriesModule;
})(typeof globalThis !== "undefined" ? globalThis : window);