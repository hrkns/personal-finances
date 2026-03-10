/**
 * Transaction Categories feature module.
 *
 * Analogy:
 * - React: resembles a stateful feature hook that manages hierarchical options.
 * - Angular: similar to a component coordinating parent/child select inputs.
 * - Vue: similar to a composable handling tree-like category relationships.
 */
(function initTransactionCategoriesModule(globalScope) {
  /**
   * Creates category CRUD controller, including parent-category option management.
   *
   * @param {{
   *   elements: object,
   *   apiRequest: (url: string, options?: RequestInit) => Promise<any>,
   *   normalizeTransactionCategoryInput: (name: string, parentId: string) => object,
   *   escapeHtml: (value: any) => string,
   *   getTransactionCategories: () => any[],
   *   setTransactionCategories: (items: any[]) => void,
   *   onTransactionCategoriesChanged?: () => void,
   *   generateActionsCell: (item: any) => string
   * }} config
   * @returns {{load: Function, render: Function, onSubmit: Function, onRowAction: Function, resetForm: Function, setMessage: Function, populateParentOptions: Function}}
   */
  function createTransactionCategoriesModule(config) {
    const {
      elements,
      apiRequest,
      normalizeTransactionCategoryInput,
      escapeHtml,
      getTransactionCategories,
      setTransactionCategories,
      onTransactionCategoriesChanged,
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

    function resetForm() {
      elements.formElement.reset();
      elements.idElement.value = "";
      elements.submitButtonElement.textContent = "Create";
      if (elements.modalTitleElement) {
        elements.modalTitleElement.textContent = "Create transaction category";
      }
      populateParentOptions();
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
          ${generateActionsCell(category)}
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
      initializeModalBindings();

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

        hideModal();
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
        if (elements.modalTitleElement) {
          elements.modalTitleElement.textContent = "Edit transaction category";
        }
        showModal();
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