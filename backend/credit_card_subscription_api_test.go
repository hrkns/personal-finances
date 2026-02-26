package backend

import (
	"encoding/json"
	"net/http"
	"testing"
)

type creditCardSubscriptionErrorEnvelope struct {
	Error struct {
		Code    string `json:"code"`
		Message string `json:"message"`
	} `json:"error"`
}

func TestCreditCardSubscriptionCRUDFlow(t *testing.T) {
	application := newTestApplication(t)
	router := application.routes()

	seedCreditCardSubscriptionDependencies(t, router)

	createResponse := performRequest(
		router,
		http.MethodPost,
		"/api/credit-card-subscriptions",
		[]byte(`{"credit_card_id":1,"currency_id":1,"concept":"Streaming Service","amount":19.99}`),
	)
	if createResponse.Code != http.StatusCreated {
		t.Fatalf("expected create to return 201, got %d", createResponse.Code)
	}

	var created creditCardSubscription
	if err := json.NewDecoder(createResponse.Body).Decode(&created); err != nil {
		t.Fatalf("decode created response: %v", err)
	}
	if created.CreditCardID != 1 || created.CurrencyID != 1 || created.Concept != "Streaming Service" || created.Amount != 19.99 {
		t.Fatalf("unexpected created credit card subscription: %+v", created)
	}

	listResponse := performRequest(router, http.MethodGet, "/api/credit-card-subscriptions", nil)
	if listResponse.Code != http.StatusOK {
		t.Fatalf("expected list to return 200, got %d", listResponse.Code)
	}

	getResponse := performRequest(router, http.MethodGet, "/api/credit-card-subscriptions/1", nil)
	if getResponse.Code != http.StatusOK {
		t.Fatalf("expected get to return 200, got %d", getResponse.Code)
	}

	updateResponse := performRequest(
		router,
		http.MethodPut,
		"/api/credit-card-subscriptions/1",
		[]byte(`{"credit_card_id":1,"currency_id":1,"concept":"Music Service","amount":12.5}`),
	)
	if updateResponse.Code != http.StatusOK {
		t.Fatalf("expected update to return 200, got %d", updateResponse.Code)
	}

	var updated creditCardSubscription
	if err := json.NewDecoder(updateResponse.Body).Decode(&updated); err != nil {
		t.Fatalf("decode updated response: %v", err)
	}
	if updated.Concept != "Music Service" || updated.Amount != 12.5 {
		t.Fatalf("unexpected updated credit card subscription: %+v", updated)
	}

	deleteResponse := performRequest(router, http.MethodDelete, "/api/credit-card-subscriptions/1", nil)
	if deleteResponse.Code != http.StatusNoContent {
		t.Fatalf("expected delete to return 204, got %d", deleteResponse.Code)
	}

	getAfterDelete := performRequest(router, http.MethodGet, "/api/credit-card-subscriptions/1", nil)
	if getAfterDelete.Code != http.StatusNotFound {
		t.Fatalf("expected get after delete to return 404, got %d", getAfterDelete.Code)
	}
}

func TestCreditCardSubscriptionValidationErrors(t *testing.T) {
	application := newTestApplication(t)
	router := application.routes()

	seedCreditCardSubscriptionDependencies(t, router)

	invalidCardID := performRequest(
		router,
		http.MethodPost,
		"/api/credit-card-subscriptions",
		[]byte(`{"credit_card_id":0,"currency_id":1,"concept":"A","amount":10}`),
	)
	if invalidCardID.Code != http.StatusBadRequest {
		t.Fatalf("expected invalid card id to return 400, got %d", invalidCardID.Code)
	}

	invalidCurrencyID := performRequest(
		router,
		http.MethodPost,
		"/api/credit-card-subscriptions",
		[]byte(`{"credit_card_id":1,"currency_id":0,"concept":"A","amount":10}`),
	)
	if invalidCurrencyID.Code != http.StatusBadRequest {
		t.Fatalf("expected invalid currency id to return 400, got %d", invalidCurrencyID.Code)
	}

	emptyConcept := performRequest(
		router,
		http.MethodPost,
		"/api/credit-card-subscriptions",
		[]byte(`{"credit_card_id":1,"currency_id":1,"concept":"   ","amount":10}`),
	)
	if emptyConcept.Code != http.StatusBadRequest {
		t.Fatalf("expected empty concept to return 400, got %d", emptyConcept.Code)
	}

	invalidAmount := performRequest(
		router,
		http.MethodPost,
		"/api/credit-card-subscriptions",
		[]byte(`{"credit_card_id":1,"currency_id":1,"concept":"A","amount":0}`),
	)
	if invalidAmount.Code != http.StatusBadRequest {
		t.Fatalf("expected invalid amount to return 400, got %d", invalidAmount.Code)
	}

	invalidForeignKeys := performRequest(
		router,
		http.MethodPost,
		"/api/credit-card-subscriptions",
		[]byte(`{"credit_card_id":999,"currency_id":999,"concept":"A","amount":10}`),
	)
	if invalidForeignKeys.Code != http.StatusBadRequest {
		t.Fatalf("expected invalid foreign keys to return 400, got %d", invalidForeignKeys.Code)
	}

	notFound := performRequest(router, http.MethodGet, "/api/credit-card-subscriptions/999", nil)
	if notFound.Code != http.StatusNotFound {
		t.Fatalf("expected missing subscription to return 404, got %d", notFound.Code)
	}
}

func TestCreditCardSubscriptionDuplicateCombinationReturnsConflict(t *testing.T) {
	application := newTestApplication(t)
	router := application.routes()

	seedCreditCardSubscriptionDependencies(t, router)

	first := performRequest(
		router,
		http.MethodPost,
		"/api/credit-card-subscriptions",
		[]byte(`{"credit_card_id":1,"currency_id":1,"concept":"Streaming Service","amount":19.99}`),
	)
	if first.Code != http.StatusCreated {
		t.Fatalf("expected first create to return 201, got %d", first.Code)
	}

	duplicate := performRequest(
		router,
		http.MethodPost,
		"/api/credit-card-subscriptions",
		[]byte(`{"credit_card_id":1,"currency_id":1,"concept":"Streaming Service","amount":29.99}`),
	)
	if duplicate.Code != http.StatusConflict {
		t.Fatalf("expected duplicate create to return 409, got %d", duplicate.Code)
	}

	var createError creditCardSubscriptionErrorEnvelope
	if err := json.NewDecoder(duplicate.Body).Decode(&createError); err != nil {
		t.Fatalf("decode duplicate create error: %v", err)
	}
	if createError.Error.Code != "duplicate_credit_card_subscription" {
		t.Fatalf("expected duplicate create code, got %q", createError.Error.Code)
	}

	createSecond := performRequest(
		router,
		http.MethodPost,
		"/api/credit-card-subscriptions",
		[]byte(`{"credit_card_id":1,"currency_id":1,"concept":"Cloud Storage","amount":9.99}`),
	)
	if createSecond.Code != http.StatusCreated {
		t.Fatalf("expected second create to return 201, got %d", createSecond.Code)
	}

	duplicateUpdate := performRequest(
		router,
		http.MethodPut,
		"/api/credit-card-subscriptions/2",
		[]byte(`{"credit_card_id":1,"currency_id":1,"concept":"Streaming Service","amount":9.99}`),
	)
	if duplicateUpdate.Code != http.StatusConflict {
		t.Fatalf("expected duplicate update to return 409, got %d", duplicateUpdate.Code)
	}

	var updateError creditCardSubscriptionErrorEnvelope
	if err := json.NewDecoder(duplicateUpdate.Body).Decode(&updateError); err != nil {
		t.Fatalf("decode duplicate update error: %v", err)
	}
	if updateError.Error.Code != "duplicate_credit_card_subscription" {
		t.Fatalf("expected duplicate update code, got %q", updateError.Error.Code)
	}
}

func seedCreditCardSubscriptionDependencies(t *testing.T, router http.Handler) {
	t.Helper()

	seedCreditCardDependencies(t, router)

	creditCard := performRequest(
		router,
		http.MethodPost,
		"/api/credit-cards",
		[]byte(`{"bank_id":1,"person_id":1,"number":"4444 4444 4444 4444"}`),
	)
	if creditCard.Code != http.StatusCreated {
		t.Fatalf("expected credit card seed to return 201, got %d", creditCard.Code)
	}

	currency := performRequest(
		router,
		http.MethodPost,
		"/api/currencies",
		[]byte(`{"name":"US Dollar","code":"USD"}`),
	)
	if currency.Code != http.StatusCreated {
		t.Fatalf("expected currency seed to return 201, got %d", currency.Code)
	}
}
