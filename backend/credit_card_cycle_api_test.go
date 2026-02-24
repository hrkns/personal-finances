package backend

import (
	"encoding/json"
	"net/http"
	"testing"
)

func TestCreditCardCycleCRUDFlow(t *testing.T) {
	application := newTestApplication(t)
	router := application.routes()

	seedCreditCardDependencies(t, router)
	seedCreditCard := performRequest(
		router,
		http.MethodPost,
		"/api/credit-cards",
		[]byte(`{"bank_id":1,"person_id":1,"number":"4111 1111"}`),
	)
	if seedCreditCard.Code != http.StatusCreated {
		t.Fatalf("expected credit card seed to return 201, got %d", seedCreditCard.Code)
	}

	createResponse := performRequest(
		router,
		http.MethodPost,
		"/api/credit-card-cycles",
		[]byte(`{"credit_card_id":1,"closing_date":"2026-03-20","due_date":"2026-03-30"}`),
	)
	if createResponse.Code != http.StatusCreated {
		t.Fatalf("expected create to return 201, got %d", createResponse.Code)
	}
	if createResponse.Header().Get("Location") == "" {
		t.Fatal("expected Location header for created credit card cycle")
	}

	var created creditCardCycle
	if err := json.NewDecoder(createResponse.Body).Decode(&created); err != nil {
		t.Fatalf("decode created response: %v", err)
	}
	if created.CreditCardID != 1 || created.ClosingDate != "2026-03-20" || created.DueDate != "2026-03-30" {
		t.Fatalf("unexpected created credit card cycle: %+v", created)
	}

	listResponse := performRequest(router, http.MethodGet, "/api/credit-card-cycles", nil)
	if listResponse.Code != http.StatusOK {
		t.Fatalf("expected list to return 200, got %d", listResponse.Code)
	}

	updateResponse := performRequest(
		router,
		http.MethodPut,
		"/api/credit-card-cycles/1",
		[]byte(`{"credit_card_id":1,"closing_date":"2026-04-20","due_date":"2026-04-30"}`),
	)
	if updateResponse.Code != http.StatusOK {
		t.Fatalf("expected update to return 200, got %d", updateResponse.Code)
	}

	var updated creditCardCycle
	if err := json.NewDecoder(updateResponse.Body).Decode(&updated); err != nil {
		t.Fatalf("decode updated response: %v", err)
	}
	if updated.ClosingDate != "2026-04-20" || updated.DueDate != "2026-04-30" {
		t.Fatalf("unexpected updated dates: %+v", updated)
	}

	deleteResponse := performRequest(router, http.MethodDelete, "/api/credit-card-cycles/1", nil)
	if deleteResponse.Code != http.StatusNoContent {
		t.Fatalf("expected delete to return 204, got %d", deleteResponse.Code)
	}

	getAfterDelete := performRequest(router, http.MethodGet, "/api/credit-card-cycles/1", nil)
	if getAfterDelete.Code != http.StatusNotFound {
		t.Fatalf("expected get after delete to return 404, got %d", getAfterDelete.Code)
	}
}

func TestCreditCardCycleUniqueConstraint(t *testing.T) {
	application := newTestApplication(t)
	router := application.routes()

	seedCreditCardDependencies(t, router)
	seedCreditCard := performRequest(
		router,
		http.MethodPost,
		"/api/credit-cards",
		[]byte(`{"bank_id":1,"person_id":1,"number":"7777"}`),
	)
	if seedCreditCard.Code != http.StatusCreated {
		t.Fatalf("expected credit card seed to return 201, got %d", seedCreditCard.Code)
	}

	first := performRequest(
		router,
		http.MethodPost,
		"/api/credit-card-cycles",
		[]byte(`{"credit_card_id":1,"closing_date":"2026-05-01","due_date":"2026-05-10"}`),
	)
	if first.Code != http.StatusCreated {
		t.Fatalf("expected first create to return 201, got %d", first.Code)
	}

	duplicate := performRequest(
		router,
		http.MethodPost,
		"/api/credit-card-cycles",
		[]byte(`{"credit_card_id":1,"closing_date":"2026-05-01","due_date":"2026-05-10"}`),
	)
	if duplicate.Code != http.StatusConflict {
		t.Fatalf("expected duplicate create to return 409, got %d", duplicate.Code)
	}
}

func TestCreditCardCycleValidationErrors(t *testing.T) {
	application := newTestApplication(t)
	router := application.routes()

	seedCreditCardDependencies(t, router)
	seedCreditCard := performRequest(
		router,
		http.MethodPost,
		"/api/credit-cards",
		[]byte(`{"bank_id":1,"person_id":1,"number":"9999"}`),
	)
	if seedCreditCard.Code != http.StatusCreated {
		t.Fatalf("expected credit card seed to return 201, got %d", seedCreditCard.Code)
	}

	invalidDate := performRequest(
		router,
		http.MethodPost,
		"/api/credit-card-cycles",
		[]byte(`{"credit_card_id":1,"closing_date":"2026/01/01","due_date":"2026-01-10"}`),
	)
	if invalidDate.Code != http.StatusBadRequest {
		t.Fatalf("expected invalid date to return 400, got %d", invalidDate.Code)
	}

	dueBeforeClosing := performRequest(
		router,
		http.MethodPost,
		"/api/credit-card-cycles",
		[]byte(`{"credit_card_id":1,"closing_date":"2026-01-20","due_date":"2026-01-10"}`),
	)
	if dueBeforeClosing.Code != http.StatusBadRequest {
		t.Fatalf("expected due date before closing date to return 400, got %d", dueBeforeClosing.Code)
	}

	invalidCreditCard := performRequest(
		router,
		http.MethodPost,
		"/api/credit-card-cycles",
		[]byte(`{"credit_card_id":999,"closing_date":"2026-01-01","due_date":"2026-01-10"}`),
	)
	if invalidCreditCard.Code != http.StatusBadRequest {
		t.Fatalf("expected invalid credit card to return 400, got %d", invalidCreditCard.Code)
	}

	invalidID := performRequest(router, http.MethodGet, "/api/credit-card-cycles/not-a-number", nil)
	if invalidID.Code != http.StatusBadRequest {
		t.Fatalf("expected invalid id to return 400, got %d", invalidID.Code)
	}
}