package backend

import (
	"encoding/json"
	"net/http"
	"testing"
)

func TestCreditCardCycleBalanceCRUDFlow(t *testing.T) {
	application := newTestApplication(t)
	router := application.routes()

	seedCreditCardCycleBalanceDependencies(t, router)

	createResponse := performRequest(
		router,
		http.MethodPost,
		"/api/credit-card-cycles/1/balances",
		[]byte(`{"credit_card_cycle_id":1,"currency_id":1,"balance":500.25,"paid":false}`),
	)
	if createResponse.Code != http.StatusCreated {
		t.Fatalf("expected create to return 201, got %d", createResponse.Code)
	}

	var created creditCardCycleBalance
	if err := json.NewDecoder(createResponse.Body).Decode(&created); err != nil {
		t.Fatalf("decode created response: %v", err)
	}
	if created.CreditCardCycleID != 1 || created.CurrencyID != 1 || created.Balance != 500.25 || created.Paid {
		t.Fatalf("unexpected created credit card cycle balance: %+v", created)
	}

	listResponse := performRequest(router, http.MethodGet, "/api/credit-card-cycles/1/balances", nil)
	if listResponse.Code != http.StatusOK {
		t.Fatalf("expected list to return 200, got %d", listResponse.Code)
	}

	getResponse := performRequest(router, http.MethodGet, "/api/credit-card-cycles/1/balances/1", nil)
	if getResponse.Code != http.StatusOK {
		t.Fatalf("expected get to return 200, got %d", getResponse.Code)
	}

	updateResponse := performRequest(
		router,
		http.MethodPut,
		"/api/credit-card-cycles/1/balances/1",
		[]byte(`{"credit_card_cycle_id":1,"currency_id":1,"balance":123.45,"paid":true}`),
	)
	if updateResponse.Code != http.StatusOK {
		t.Fatalf("expected update to return 200, got %d", updateResponse.Code)
	}

	var updated creditCardCycleBalance
	if err := json.NewDecoder(updateResponse.Body).Decode(&updated); err != nil {
		t.Fatalf("decode updated response: %v", err)
	}
	if updated.Balance != 123.45 || !updated.Paid {
		t.Fatalf("unexpected updated credit card cycle balance: %+v", updated)
	}

	deleteResponse := performRequest(router, http.MethodDelete, "/api/credit-card-cycles/1/balances/1", nil)
	if deleteResponse.Code != http.StatusNoContent {
		t.Fatalf("expected delete to return 204, got %d", deleteResponse.Code)
	}

	getAfterDelete := performRequest(router, http.MethodGet, "/api/credit-card-cycles/1/balances/1", nil)
	if getAfterDelete.Code != http.StatusNotFound {
		t.Fatalf("expected get after delete to return 404, got %d", getAfterDelete.Code)
	}
}

func TestCreditCardCycleBalanceValidationErrors(t *testing.T) {
	application := newTestApplication(t)
	router := application.routes()

	seedCreditCardCycleBalanceDependencies(t, router)

	invalidCycleID := performRequest(
		router,
		http.MethodPost,
		"/api/credit-card-cycles/1/balances",
		[]byte(`{"credit_card_cycle_id":0,"currency_id":1,"balance":100,"paid":false}`),
	)
	if invalidCycleID.Code != http.StatusBadRequest {
		t.Fatalf("expected invalid cycle id to return 400, got %d", invalidCycleID.Code)
	}

	mismatchedCycleID := performRequest(
		router,
		http.MethodPost,
		"/api/credit-card-cycles/1/balances",
		[]byte(`{"credit_card_cycle_id":2,"currency_id":1,"balance":100,"paid":false}`),
	)
	if mismatchedCycleID.Code != http.StatusBadRequest {
		t.Fatalf("expected mismatched cycle id to return 400, got %d", mismatchedCycleID.Code)
	}

	invalidCurrency := performRequest(
		router,
		http.MethodPost,
		"/api/credit-card-cycles/1/balances",
		[]byte(`{"credit_card_cycle_id":1,"currency_id":999,"balance":100,"paid":false}`),
	)
	if invalidCurrency.Code != http.StatusBadRequest {
		t.Fatalf("expected invalid currency to return 400, got %d", invalidCurrency.Code)
	}

	notFoundBalance := performRequest(router, http.MethodGet, "/api/credit-card-cycles/1/balances/999", nil)
	if notFoundBalance.Code != http.StatusNotFound {
		t.Fatalf("expected balance not found to return 404, got %d", notFoundBalance.Code)
	}
}

func TestCreditCardCycleBalanceUniqueCycleCurrency(t *testing.T) {
	application := newTestApplication(t)
	router := application.routes()

	seedCreditCardCycleBalanceDependencies(t, router)

	firstCreate := performRequest(
		router,
		http.MethodPost,
		"/api/credit-card-cycles/1/balances",
		[]byte(`{"credit_card_cycle_id":1,"currency_id":1,"balance":100,"paid":false}`),
	)
	if firstCreate.Code != http.StatusCreated {
		t.Fatalf("expected first create to return 201, got %d", firstCreate.Code)
	}

	duplicateCreate := performRequest(
		router,
		http.MethodPost,
		"/api/credit-card-cycles/1/balances",
		[]byte(`{"credit_card_cycle_id":1,"currency_id":1,"balance":200,"paid":true}`),
	)
	if duplicateCreate.Code != http.StatusConflict {
		t.Fatalf("expected duplicate create to return 409, got %d", duplicateCreate.Code)
	}

	secondCurrencyBalance := performRequest(
		router,
		http.MethodPost,
		"/api/credit-card-cycles/1/balances",
		[]byte(`{"credit_card_cycle_id":1,"currency_id":2,"balance":300,"paid":false}`),
	)
	if secondCurrencyBalance.Code != http.StatusCreated {
		t.Fatalf("expected second currency create to return 201, got %d", secondCurrencyBalance.Code)
	}

	duplicateUpdate := performRequest(
		router,
		http.MethodPut,
		"/api/credit-card-cycles/1/balances/2",
		[]byte(`{"credit_card_cycle_id":1,"currency_id":1,"balance":350,"paid":true}`),
	)
	if duplicateUpdate.Code != http.StatusConflict {
		t.Fatalf("expected duplicate update to return 409, got %d", duplicateUpdate.Code)
	}
}

func seedCreditCardCycleBalanceDependencies(t *testing.T, router http.Handler) {
	t.Helper()

	seedCreditCardDependencies(t, router)

	currency := performRequest(router, http.MethodPost, "/api/currencies", []byte(`{"name":"US Dollar","code":"USD"}`))
	if currency.Code != http.StatusCreated {
		t.Fatalf("expected currency seed to return 201, got %d", currency.Code)
	}

	secondCurrency := performRequest(router, http.MethodPost, "/api/currencies", []byte(`{"name":"Euro","code":"EUR"}`))
	if secondCurrency.Code != http.StatusCreated {
		t.Fatalf("expected second currency seed to return 201, got %d", secondCurrency.Code)
	}

	creditCard := performRequest(router, http.MethodPost, "/api/credit-cards", []byte(`{"bank_id":1,"person_id":1,"number":"1111 2222"}`))
	if creditCard.Code != http.StatusCreated {
		t.Fatalf("expected credit card seed to return 201, got %d", creditCard.Code)
	}

	cycle := performRequest(router, http.MethodPost, "/api/credit-card-cycles", []byte(`{"credit_card_id":1,"closing_date":"2026-01-01","due_date":"2026-01-10"}`))
	if cycle.Code != http.StatusCreated {
		t.Fatalf("expected cycle seed to return 201, got %d", cycle.Code)
	}
}
