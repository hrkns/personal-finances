package backend

import (
	"encoding/json"
	"net/http"
	"testing"
)

func TestTransactionCRUDFlow(t *testing.T) {
	application := newTestApplication(t)
	router := application.routes()

	seedTransactionDependencies(t, router)

	createResponse := performRequest(
		router,
		http.MethodPost,
		"/api/transactions",
		[]byte(`{"transaction_date":"2026-02-18","type":"income","amount":1200.50,"notes":"Salary payment","person_id":1,"bank_account_id":1,"category_id":1}`),
	)
	if createResponse.Code != http.StatusCreated {
		t.Fatalf("expected create to return 201, got %d", createResponse.Code)
	}
	if createResponse.Header().Get("Location") == "" {
		t.Fatal("expected Location header for created transaction")
	}

	var created transaction
	if err := json.NewDecoder(createResponse.Body).Decode(&created); err != nil {
		t.Fatalf("decode created response: %v", err)
	}
	if created.TransactionDate != "2026-02-18" || created.Type != "income" || created.Amount != 1200.50 {
		t.Fatalf("unexpected created transaction: %+v", created)
	}
	if created.Notes == nil || *created.Notes != "Salary payment" {
		t.Fatalf("expected notes to be present, got %+v", created.Notes)
	}

	listResponse := performRequest(router, http.MethodGet, "/api/transactions", nil)
	if listResponse.Code != http.StatusOK {
		t.Fatalf("expected list to return 200, got %d", listResponse.Code)
	}

	updateResponse := performRequest(
		router,
		http.MethodPut,
		"/api/transactions/1",
		[]byte(`{"transaction_date":"2026-02-19","type":"expense","amount":200.00,"notes":"  ","person_id":1,"bank_account_id":1,"category_id":1}`),
	)
	if updateResponse.Code != http.StatusOK {
		t.Fatalf("expected update to return 200, got %d", updateResponse.Code)
	}

	var updated transaction
	if err := json.NewDecoder(updateResponse.Body).Decode(&updated); err != nil {
		t.Fatalf("decode updated response: %v", err)
	}
	if updated.Type != "expense" || updated.TransactionDate != "2026-02-19" || updated.Amount != 200 {
		t.Fatalf("unexpected updated transaction: %+v", updated)
	}
	if updated.Notes != nil {
		t.Fatalf("expected blank notes to be normalized to null, got %+v", updated.Notes)
	}

	deleteResponse := performRequest(router, http.MethodDelete, "/api/transactions/1", nil)
	if deleteResponse.Code != http.StatusNoContent {
		t.Fatalf("expected delete to return 204, got %d", deleteResponse.Code)
	}

	getAfterDelete := performRequest(router, http.MethodGet, "/api/transactions/1", nil)
	if getAfterDelete.Code != http.StatusNotFound {
		t.Fatalf("expected get after delete to return 404, got %d", getAfterDelete.Code)
	}
}

func TestTransactionValidationErrors(t *testing.T) {
	application := newTestApplication(t)
	router := application.routes()

	seedTransactionDependencies(t, router)

	invalidDate := performRequest(
		router,
		http.MethodPost,
		"/api/transactions",
		[]byte(`{"transaction_date":"2026-02-30","type":"income","amount":100,"person_id":1,"bank_account_id":1,"category_id":1}`),
	)
	if invalidDate.Code != http.StatusBadRequest {
		t.Fatalf("expected invalid date to return 400, got %d", invalidDate.Code)
	}

	invalidType := performRequest(
		router,
		http.MethodPost,
		"/api/transactions",
		[]byte(`{"transaction_date":"2026-02-18","type":"transfer","amount":100,"person_id":1,"bank_account_id":1,"category_id":1}`),
	)
	if invalidType.Code != http.StatusBadRequest {
		t.Fatalf("expected invalid type to return 400, got %d", invalidType.Code)
	}

	invalidAmount := performRequest(
		router,
		http.MethodPost,
		"/api/transactions",
		[]byte(`{"transaction_date":"2026-02-18","type":"income","amount":0,"person_id":1,"bank_account_id":1,"category_id":1}`),
	)
	if invalidAmount.Code != http.StatusBadRequest {
		t.Fatalf("expected invalid amount to return 400, got %d", invalidAmount.Code)
	}

	missingPerson := performRequest(
		router,
		http.MethodPost,
		"/api/transactions",
		[]byte(`{"transaction_date":"2026-02-18","type":"income","amount":10,"person_id":999,"bank_account_id":1,"category_id":1}`),
	)
	if missingPerson.Code != http.StatusBadRequest {
		t.Fatalf("expected missing person to return 400, got %d", missingPerson.Code)
	}

	invalidID := performRequest(router, http.MethodGet, "/api/transactions/not-a-number", nil)
	if invalidID.Code != http.StatusBadRequest {
		t.Fatalf("expected invalid id to return 400, got %d", invalidID.Code)
	}
}

func seedTransactionDependencies(t *testing.T, router http.Handler) {
	t.Helper()

	currency := performRequest(router, http.MethodPost, "/api/currencies", []byte(`{"name":"US Dollar","code":"USD"}`))
	if currency.Code != http.StatusCreated {
		t.Fatalf("expected currency seed to return 201, got %d", currency.Code)
	}

	bank := performRequest(router, http.MethodPost, "/api/banks", []byte(`{"name":"Bank One","country":"US"}`))
	if bank.Code != http.StatusCreated {
		t.Fatalf("expected bank seed to return 201, got %d", bank.Code)
	}

	person := performRequest(router, http.MethodPost, "/api/people", []byte(`{"name":"Jane Doe"}`))
	if person.Code != http.StatusCreated {
		t.Fatalf("expected person seed to return 201, got %d", person.Code)
	}

	category := performRequest(router, http.MethodPost, "/api/transaction-categories", []byte(`{"name":"Salary"}`))
	if category.Code != http.StatusCreated {
		t.Fatalf("expected transaction category seed to return 201, got %d", category.Code)
	}

	bankAccount := performRequest(
		router,
		http.MethodPost,
		"/api/bank-accounts",
		[]byte(`{"bank_id":1,"currency_id":1,"account_number":"ACC-001","balance":100}`),
	)
	if bankAccount.Code != http.StatusCreated {
		t.Fatalf("expected bank account seed to return 201, got %d", bankAccount.Code)
	}
}
