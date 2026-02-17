package backend

import (
	"encoding/json"
	"net/http"
	"testing"
)

func TestBankAccountCRUDFlow(t *testing.T) {
	application := newTestApplication(t)
	router := application.routes()

	seedCurrency := performRequest(router, http.MethodPost, "/api/currencies", []byte(`{"name":"US Dollar","code":"USD"}`))
	if seedCurrency.Code != http.StatusCreated {
		t.Fatalf("expected currency seed to return 201, got %d", seedCurrency.Code)
	}

	seedBank := performRequest(router, http.MethodPost, "/api/banks", []byte(`{"name":"Bank One","country":"US"}`))
	if seedBank.Code != http.StatusCreated {
		t.Fatalf("expected bank seed to return 201, got %d", seedBank.Code)
	}

	createBody := []byte(`{"bank_id":1,"currency_id":1,"account_number":"ACC-001","balance":100.5}`)
	createResponse := performRequest(router, http.MethodPost, "/api/bank-accounts", createBody)
	if createResponse.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d", createResponse.Code)
	}
	if createResponse.Header().Get("Location") == "" {
		t.Fatal("expected Location header for created bank account")
	}

	var created bankAccount
	if err := json.NewDecoder(createResponse.Body).Decode(&created); err != nil {
		t.Fatalf("decode created response: %v", err)
	}
	if created.BankID != 1 || created.CurrencyID != 1 {
		t.Fatalf("unexpected created references: %+v", created)
	}

	listResponse := performRequest(router, http.MethodGet, "/api/bank-accounts", nil)
	if listResponse.Code != http.StatusOK {
		t.Fatalf("expected 200 for list, got %d", listResponse.Code)
	}

	updateBody := []byte(`{"bank_id":1,"currency_id":1,"account_number":"ACC-001-UPDATED","balance":555}`)
	updateResponse := performRequest(router, http.MethodPut, "/api/bank-accounts/1", updateBody)
	if updateResponse.Code != http.StatusOK {
		t.Fatalf("expected 200 for update, got %d", updateResponse.Code)
	}

	deleteResponse := performRequest(router, http.MethodDelete, "/api/bank-accounts/1", nil)
	if deleteResponse.Code != http.StatusNoContent {
		t.Fatalf("expected 204 for delete, got %d", deleteResponse.Code)
	}

	getAfterDelete := performRequest(router, http.MethodGet, "/api/bank-accounts/1", nil)
	if getAfterDelete.Code != http.StatusNotFound {
		t.Fatalf("expected 404 after delete, got %d", getAfterDelete.Code)
	}
}

func TestBankAccountUniqueConstraint(t *testing.T) {
	application := newTestApplication(t)
	router := application.routes()

	performRequest(router, http.MethodPost, "/api/currencies", []byte(`{"name":"US Dollar","code":"USD"}`))
	performRequest(router, http.MethodPost, "/api/currencies", []byte(`{"name":"Euro","code":"EUR"}`))
	performRequest(router, http.MethodPost, "/api/banks", []byte(`{"name":"Bank One","country":"US"}`))
	performRequest(router, http.MethodPost, "/api/banks", []byte(`{"name":"Bank Two","country":"US"}`))

	first := performRequest(router, http.MethodPost, "/api/bank-accounts", []byte(`{"bank_id":1,"currency_id":1,"account_number":"ACC-001","balance":1}`))
	if first.Code != http.StatusCreated {
		t.Fatalf("expected first create to return 201, got %d", first.Code)
	}

	duplicate := performRequest(router, http.MethodPost, "/api/bank-accounts", []byte(`{"bank_id":1,"currency_id":1,"account_number":"ACC-001","balance":2}`))
	if duplicate.Code != http.StatusConflict {
		t.Fatalf("expected duplicate create to return 409, got %d", duplicate.Code)
	}

	differentCurrency := performRequest(router, http.MethodPost, "/api/bank-accounts", []byte(`{"bank_id":1,"currency_id":2,"account_number":"ACC-001","balance":3}`))
	if differentCurrency.Code != http.StatusCreated {
		t.Fatalf("expected different currency to return 201, got %d", differentCurrency.Code)
	}

	differentBank := performRequest(router, http.MethodPost, "/api/bank-accounts", []byte(`{"bank_id":2,"currency_id":1,"account_number":"ACC-001","balance":4}`))
	if differentBank.Code != http.StatusCreated {
		t.Fatalf("expected different bank to return 201, got %d", differentBank.Code)
	}
}

func TestBankAccountValidationErrors(t *testing.T) {
	application := newTestApplication(t)
	router := application.routes()

	performRequest(router, http.MethodPost, "/api/currencies", []byte(`{"name":"US Dollar","code":"USD"}`))
	performRequest(router, http.MethodPost, "/api/banks", []byte(`{"name":"Bank One","country":"US"}`))

	invalidBank := performRequest(router, http.MethodPost, "/api/bank-accounts", []byte(`{"bank_id":999,"currency_id":1,"account_number":"ACC-001","balance":10}`))
	if invalidBank.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for invalid bank, got %d", invalidBank.Code)
	}

	invalidCurrency := performRequest(router, http.MethodPost, "/api/bank-accounts", []byte(`{"bank_id":1,"currency_id":999,"account_number":"ACC-001","balance":10}`))
	if invalidCurrency.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for invalid currency, got %d", invalidCurrency.Code)
	}

	invalidPayload := performRequest(router, http.MethodPost, "/api/bank-accounts", []byte(`{"bank_id":1,"currency_id":1,"account_number":"   ","balance":10}`))
	if invalidPayload.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for invalid account_number, got %d", invalidPayload.Code)
	}

	invalidID := performRequest(router, http.MethodGet, "/api/bank-accounts/not-a-number", nil)
	if invalidID.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for invalid id, got %d", invalidID.Code)
	}
}
