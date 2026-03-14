/**
 * Shared Bootstrap modal/toast UI feedback helpers.
 */
(function initUIFeedback(globalScope) {
  /**
   * Creates shared modal + toast behavior for a feature module.
   *
   * @param {{
   *   elements: {
   *     openModalButtonElement?: HTMLElement | null,
   *     cancelButtonElement?: HTMLElement | null,
   *     modalElement?: HTMLElement | null,
   *     toastElement?: HTMLElement | null,
   *     messageElement: HTMLElement
   *   },
   *   globalScope: any
   * }} config
   * @returns {{
   *   setMessage: (message: string, isError: boolean) => void,
   *   showModal: () => void,
   *   hideModal: () => void,
   *   initModalBindings: (resetForm: () => void, callbacks?: {
   *     onOpen?: () => void,
   *     onCancel?: () => void,
   *     onHidden?: () => void
   *   }) => void
   * }}
   */
  function createUIFeedback(config) {
    const { elements, globalScope: moduleGlobalScope } = config;

    const bootstrapModal = moduleGlobalScope.bootstrap?.Modal;
    const bootstrapToast = moduleGlobalScope.bootstrap?.Toast;
    const hasModalSupport = Boolean(bootstrapModal && elements.modalElement);
    const hasToastSupport = Boolean(bootstrapToast && elements.toastElement);
    const modalInstance = hasModalSupport ? bootstrapModal.getOrCreateInstance(elements.modalElement) : null;
    const toastInstance = hasToastSupport ? bootstrapToast.getOrCreateInstance(elements.toastElement) : null;

    let bindingsInitialized = false;

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

    function initBindings(callbacks = {}) {
      if (bindingsInitialized) {
        return;
      }

      if (elements.openModalButtonElement && callbacks.onOpen) {
        elements.openModalButtonElement.addEventListener("click", callbacks.onOpen);
      }

      if (elements.cancelButtonElement && callbacks.onCancel) {
        elements.cancelButtonElement.addEventListener("click", callbacks.onCancel);
      }

      if (elements.modalElement && callbacks.onHidden) {
        elements.modalElement.addEventListener("hidden.bs.modal", callbacks.onHidden);
      }

      bindingsInitialized = true;
    }

    function initModalBindings(resetForm, callbacks = {}) {
      initBindings({
        // Escape hatch: callers can override any lifecycle callback.
        onOpen: callbacks.onOpen || (() => {
          resetForm();
          showModal();
        }),
        onCancel: callbacks.onCancel || (() => {
          hideModal();
          resetForm();
        }),
        onHidden: callbacks.onHidden || (() => {
          resetForm();
        }),
      });
    }

    return {
      setMessage,
      showModal,
      hideModal,
      initModalBindings,
    };
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { createUIFeedback };
    return;
  }

  globalScope.createUIFeedback = createUIFeedback;
})(typeof globalThis !== "undefined" ? globalThis : window);
