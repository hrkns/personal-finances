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
		"/api/credit-card-cycle-balances",
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

	updateResponse := performRequest(
		router,
		http.MethodPut,
		"/api/credit-card-cycle-balances/1",
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

	deleteResponse := performRequest(router, http.MethodDelete, "/api/credit-card-cycle-balances/1", nil)
	if deleteResponse.Code != http.StatusNoContent {
		t.Fatalf("expected delete to return 204, got %d", deleteResponse.Code)
	}

	updateAfterDelete := performRequest(
		router,
		http.MethodPut,
		"/api/credit-card-cycle-balances/1",
		[]byte(`{"credit_card_cycle_id":1,"currency_id":1,"balance":123.45,"paid":true}`),
	)
	if updateAfterDelete.Code != http.StatusNotFound {
		t.Fatalf("expected update after delete to return 404, got %d", updateAfterDelete.Code)
	}
}

func TestCreditCardCycleBalanceValidationErrors(t *testing.T) {
	application := newTestApplication(t)
	router := application.routes()

	seedCreditCardCycleBalanceDependencies(t, router)

	invalidCycleID := performRequest(
		router,
		http.MethodPost,
		"/api/credit-card-cycle-balances",
		[]byte(`{"credit_card_cycle_id":0,"currency_id":1,"balance":100,"paid":false}`),
	)
	if invalidCycleID.Code != http.StatusBadRequest {
		t.Fatalf("expected invalid cycle id to return 400, got %d", invalidCycleID.Code)
	}

	invalidCurrency := performRequest(
		router,
		http.MethodPost,
		"/api/credit-card-cycle-balances",
		[]byte(`{"credit_card_cycle_id":1,"currency_id":999,"balance":100,"paid":false}`),
	)
	if invalidCurrency.Code != http.StatusBadRequest {
		t.Fatalf("expected invalid currency to return 400, got %d", invalidCurrency.Code)
	}

	notFoundBalance := performRequest(
		router,
		http.MethodPut,
		"/api/credit-card-cycle-balances/999",
		[]byte(`{"credit_card_cycle_id":1,"currency_id":1,"balance":100,"paid":false}`),
	)
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
		"/api/credit-card-cycle-balances",
		[]byte(`{"credit_card_cycle_id":1,"currency_id":1,"balance":100,"paid":false}`),
	)
	if firstCreate.Code != http.StatusCreated {
		t.Fatalf("expected first create to return 201, got %d", firstCreate.Code)
	}

	duplicateCreate := performRequest(
		router,
		http.MethodPost,
		"/api/credit-card-cycle-balances",
		[]byte(`{"credit_card_cycle_id":1,"currency_id":1,"balance":200,"paid":true}`),
	)
	if duplicateCreate.Code != http.StatusConflict {
		t.Fatalf("expected duplicate create to return 409, got %d", duplicateCreate.Code)
	}

	secondCurrencyBalance := performRequest(
		router,
		http.MethodPost,
		"/api/credit-card-cycle-balances",
		[]byte(`{"credit_card_cycle_id":1,"currency_id":2,"balance":300,"paid":false}`),
	)
	if secondCurrencyBalance.Code != http.StatusCreated {
		t.Fatalf("expected second currency create to return 201, got %d", secondCurrencyBalance.Code)
	}

	duplicateUpdate := performRequest(
		router,
		http.MethodPut,
		"/api/credit-card-cycle-balances/2",
		[]byte(`{"credit_card_cycle_id":1,"currency_id":1,"balance":350,"paid":true}`),
	)
	if duplicateUpdate.Code != http.StatusConflict {
		t.Fatalf("expected duplicate update to return 409, got %d", duplicateUpdate.Code)
	}
}

func TestCreditCardCycleBalanceListAll(t *testing.T) {
	application := newTestApplication(t)
	router := application.routes()

	seedCreditCardCycleBalanceDependencies(t, router)

	secondCycle := performRequest(
		router,
		http.MethodPost,
		"/api/credit-card-cycles",
		[]byte(`{"credit_card_id":1,"closing_date":"2026-02-01","due_date":"2026-02-10"}`),
	)
	if secondCycle.Code != http.StatusCreated {
		t.Fatalf("expected second cycle seed to return 201, got %d", secondCycle.Code)
	}

	firstBalance := performRequest(
		router,
		http.MethodPost,
		"/api/credit-card-cycle-balances",
		[]byte(`{"credit_card_cycle_id":1,"currency_id":1,"balance":100.5,"paid":false}`),
	)
	if firstBalance.Code != http.StatusCreated {
		t.Fatalf("expected first balance create to return 201, got %d", firstBalance.Code)
	}

	secondBalance := performRequest(
		router,
		http.MethodPost,
		"/api/credit-card-cycle-balances",
		[]byte(`{"credit_card_cycle_id":2,"currency_id":1,"balance":220.75,"paid":true}`),
	)
	if secondBalance.Code != http.StatusCreated {
		t.Fatalf("expected second balance create to return 201, got %d", secondBalance.Code)
	}

	listAllResponse := performRequest(router, http.MethodGet, "/api/credit-card-cycle-balances", nil)
	if listAllResponse.Code != http.StatusOK {
		t.Fatalf("expected list all to return 200, got %d", listAllResponse.Code)
	}

	var balances []creditCardCycleBalance
	if err := json.NewDecoder(listAllResponse.Body).Decode(&balances); err != nil {
		t.Fatalf("decode list all response: %v", err)
	}

	if len(balances) != 2 {
		t.Fatalf("expected 2 balances, got %d", len(balances))
	}

	if balances[0].CreditCardCycleID != 1 || balances[1].CreditCardCycleID != 2 {
		t.Fatalf("expected balances sorted by id with cycle ids 1 then 2, got %+v", balances)
	}
}

func TestCreditCardCycleBalanceLegacyCycleScopedGETRoutesReturnMethodNotAllowed(t *testing.T) {
	application := newTestApplication(t)
	router := application.routes()

	seedCreditCardCycleBalanceDependencies(t, router)

	legacyCollectionGET := performRequest(router, http.MethodGet, "/api/credit-card-cycles/1/balances", nil)
	if legacyCollectionGET.Code != http.StatusMethodNotAllowed {
		t.Fatalf("expected legacy cycle-scoped collection GET to return 405, got %d", legacyCollectionGET.Code)
	}

	legacyByIDGET := performRequest(router, http.MethodGet, "/api/credit-card-cycles/1/balances/1", nil)
	if legacyByIDGET.Code != http.StatusMethodNotAllowed {
		t.Fatalf("expected legacy cycle-scoped by-id GET to return 405, got %d", legacyByIDGET.Code)
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
