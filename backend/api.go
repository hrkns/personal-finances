package backend

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"
)

type apiError struct {
	Error errorBody `json:"error"`
}

type errorBody struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

func (application app) routes() http.Handler {
	mux := http.NewServeMux()
	application.registerAPIRoutes(mux)
	mux.Handle("/", http.FileServer(http.Dir("web")))
	return recoverMiddleware(mux)
}

func recoverMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		defer func() {
			if recovered := recover(); recovered != nil {
				log.Printf("panic recovered for %s %s: %v", request.Method, request.URL.Path, recovered)
				writeError(writer, http.StatusInternalServerError, "internal_error", "internal server error")
			}
		}()

		next.ServeHTTP(writer, request)
	})
}

func (application app) registerAPIRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/api/health", healthHandler)
	application.registerTransactionRoutes(mux)
	application.registerTransactionCategoryRoutes(mux)
	application.registerPeopleRoutes(mux)
	application.registerCurrencyRoutes(mux)
	application.registerCountryRoutes(mux)
	application.registerBankRoutes(mux)
	application.registerBankAccountRoutes(mux)
	application.registerCreditCardRoutes(mux)
	application.registerCreditCardCycleRoutes(mux)
	application.registerCreditCardInstallmentRoutes(mux)
	application.registerCreditCardSubscriptionRoutes(mux)
}

func healthHandler(writer http.ResponseWriter, _ *http.Request) {
	writer.Header().Set("Content-Type", "application/json")
	writer.WriteHeader(http.StatusOK)

	response := map[string]string{
		"status":  "ok",
		"message": "backend is up",
	}

	if err := json.NewEncoder(writer).Encode(response); err != nil {
		http.Error(writer, "failed to encode response", http.StatusInternalServerError)
	}
}

func methodNotAllowed(writer http.ResponseWriter, allowedMethods ...string) {
	writer.Header().Set("Allow", strings.Join(allowedMethods, ", "))
	writeError(writer, http.StatusMethodNotAllowed, "method_not_allowed", "method not allowed")
}

func writeJSON(writer http.ResponseWriter, status int, payload any) {
	writer.Header().Set("Content-Type", "application/json")
	writer.WriteHeader(status)
	if err := json.NewEncoder(writer).Encode(payload); err != nil {
		http.Error(writer, "failed to encode response", http.StatusInternalServerError)
	}
}

func writeError(writer http.ResponseWriter, status int, code string, message string) {
	writeJSON(writer, status, apiError{Error: errorBody{Code: code, Message: message}})
}
