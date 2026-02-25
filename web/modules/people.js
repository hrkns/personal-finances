/**
 * People feature module.
 *
 * Analogy:
 * - React: similar to a domain hook controlling a small CRUD component tree.
 * - Angular/Vue: similar to a feature component/composable for a single entity.
 */
(function initPeopleModule(globalScope) {
  /**
   * Creates the people controller for CRUD and rendering.
   *
   * @param {{
   *   elements: object,
   *   apiRequest: (url: string, options?: RequestInit) => Promise<any>,
   *   normalizePersonInput: (name: string) => object,
   *   escapeHtml: (value: any) => string,
   *   getPeople: () => any[],
   *   setPeople: (items: any[]) => void,
   *   onPeopleChanged?: () => void
   * }} config
   * @returns {{load: Function, render: Function, onSubmit: Function, onRowAction: Function, resetForm: Function, setMessage: Function}}
   */
  function createPeopleModule(config) {
    const {
      elements,
      apiRequest,
      normalizePersonInput,
      escapeHtml,
      getPeople,
      setPeople,
      onPeopleChanged,
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
      const people = getPeople();
      elements.bodyElement.innerHTML = "";

      if (people.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 3;
        cell.textContent = "No people yet";
        row.appendChild(cell);
        elements.bodyElement.appendChild(row);
        return;
      }

      for (const person of people) {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${person.id}</td>
          <td>${escapeHtml(person.name)}</td>
          <td>
            <button type="button" data-action="edit" data-id="${person.id}">Edit</button>
            <button type="button" data-action="delete" data-id="${person.id}">Delete</button>
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
        const people = await apiRequest("/api/people", { method: "GET" });
        setPeople(people);
        render();
        if (onPeopleChanged) {
          onPeopleChanged();
        }
      } catch (error) {
        setMessage(error.message, true);
      }
    }

    async function onSubmit(event) {
      event.preventDefault();

      const id = elements.idElement.value.trim();
      const payload = normalizePersonInput(elements.nameElement.value);

      try {
        if (id) {
          await apiRequest(`/api/people/${id}`, {
            method: "PUT",
            body: JSON.stringify(payload),
          });
          setMessage("Person updated", false);
        } else {
          await apiRequest("/api/people", {
            method: "POST",
            body: JSON.stringify(payload),
          });
          setMessage("Person created", false);
        }

        resetForm();
        await load();
      } catch (error) {
        setMessage(error.message, true);
      }
    }

    async function deletePerson(id) {
      try {
        await apiRequest(`/api/people/${id}`, { method: "DELETE" });
        setMessage("Person deleted", false);
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

      const person = getPeople().find((item) => String(item.id) === id);
      if (!person) {
        return;
      }

      if (action === "edit") {
        elements.idElement.value = String(person.id);
        elements.nameElement.value = person.name;
        elements.submitButtonElement.textContent = "Update";
        elements.cancelButtonElement.hidden = false;
        setMessage(`Editing person #${person.id}`, false);
        return;
      }

      if (action === "delete") {
        deletePerson(person.id);
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
    module.exports = { createPeopleModule };
    return;
  }

  globalScope.createPeopleModule = createPeopleModule;
})(typeof globalThis !== "undefined" ? globalThis : window);
