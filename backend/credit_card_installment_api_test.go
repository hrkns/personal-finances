package backend

import (
	"encoding/json"
	"net/http"
	"testing"
)

func TestCreditCardInstallmentCRUDFlow(t *testing.T) {
	application := newTestApplication(t)
	router := application.routes()

	seedCreditCardInstallmentDependencies(t, router)

	createResponse := performRequest(
		router,
		http.MethodPost,
		"/api/credit-card-installments",
		[]byte(`{"credit_card_id":1,"concept":"Laptop","amount":1200.5,"start_date":"2026-03-01","count":12}`),
	)
	if createResponse.Code != http.StatusCreated {
		t.Fatalf("expected create to return 201, got %d", createResponse.Code)
	}

	var created creditCardInstallment
	if err := json.NewDecoder(createResponse.Body).Decode(&created); err != nil {
		t.Fatalf("decode created response: %v", err)
	}
	if created.Concept != "Laptop" || created.Amount != 1200.5 || created.StartDate != "2026-03-01" || created.Count != 12 {
		t.Fatalf("unexpected created credit card installment: %+v", created)
	}

	listResponse := performRequest(router, http.MethodGet, "/api/credit-card-installments", nil)
	if listResponse.Code != http.StatusOK {
		t.Fatalf("expected list to return 200, got %d", listResponse.Code)
	}

	getResponse := performRequest(router, http.MethodGet, "/api/credit-card-installments/1", nil)
	if getResponse.Code != http.StatusOK {
		t.Fatalf("expected get to return 200, got %d", getResponse.Code)
	}

	updateResponse := performRequest(
		router,
		http.MethodPut,
		"/api/credit-card-installments/1",
		[]byte(`{"credit_card_id":1,"concept":"Laptop Updated","amount":900,"start_date":"2026-04-01","count":10}`),
	)
	if updateResponse.Code != http.StatusOK {
		t.Fatalf("expected update to return 200, got %d", updateResponse.Code)
	}

	var updated creditCardInstallment
	if err := json.NewDecoder(updateResponse.Body).Decode(&updated); err != nil {
		t.Fatalf("decode updated response: %v", err)
	}
	if updated.Concept != "Laptop Updated" || updated.Amount != 900 || updated.StartDate != "2026-04-01" || updated.Count != 10 {
		t.Fatalf("unexpected updated credit card installment: %+v", updated)
	}

	deleteResponse := performRequest(router, http.MethodDelete, "/api/credit-card-installments/1", nil)
	if deleteResponse.Code != http.StatusNoContent {
		t.Fatalf("expected delete to return 204, got %d", deleteResponse.Code)
	}

	getAfterDelete := performRequest(router, http.MethodGet, "/api/credit-card-installments/1", nil)
	if getAfterDelete.Code != http.StatusNotFound {
		t.Fatalf("expected get after delete to return 404, got %d", getAfterDelete.Code)
	}
}

func TestCreditCardInstallmentUniqueCardConcept(t *testing.T) {
	application := newTestApplication(t)
	router := application.routes()

	seedCreditCardInstallmentDependencies(t, router)

	firstCreate := performRequest(
		router,
		http.MethodPost,
		"/api/credit-card-installments",
		[]byte(`{"credit_card_id":1,"concept":"Phone","amount":1000,"start_date":"2026-05-01","count":8}`),
	)
	if firstCreate.Code != http.StatusCreated {
		t.Fatalf("expected first create to return 201, got %d", firstCreate.Code)
	}

	duplicateCreate := performRequest(
		router,
		http.MethodPost,
		"/api/credit-card-installments",
		[]byte(`{"credit_card_id":1,"concept":"Phone","amount":500,"start_date":"2026-06-01","count":5}`),
	)
	if duplicateCreate.Code != http.StatusConflict {
		t.Fatalf("expected duplicate create to return 409, got %d", duplicateCreate.Code)
	}
}

func TestCreditCardInstallmentValidationErrors(t *testing.T) {
	application := newTestApplication(t)
	router := application.routes()

	seedCreditCardInstallmentDependencies(t, router)

	invalidCardID := performRequest(
		router,
		http.MethodPost,
		"/api/credit-card-installments",
		[]byte(`{"credit_card_id":0,"concept":"A","amount":10,"start_date":"2026-01-01","count":1}`),
	)
	if invalidCardID.Code != http.StatusBadRequest {
		t.Fatalf("expected invalid card id to return 400, got %d", invalidCardID.Code)
	}

	emptyConcept := performRequest(
		router,
		http.MethodPost,
		"/api/credit-card-installments",
		[]byte(`{"credit_card_id":1,"concept":"  ","amount":10,"start_date":"2026-01-01","count":1}`),
	)
	if emptyConcept.Code != http.StatusBadRequest {
		t.Fatalf("expected empty concept to return 400, got %d", emptyConcept.Code)
	}

	invalidAmount := performRequest(
		router,
		http.MethodPost,
		"/api/credit-card-installments",
		[]byte(`{"credit_card_id":1,"concept":"A","amount":0,"start_date":"2026-01-01","count":1}`),
	)
	if invalidAmount.Code != http.StatusBadRequest {
		t.Fatalf("expected invalid amount to return 400, got %d", invalidAmount.Code)
	}

	invalidStartDate := performRequest(
		router,
		http.MethodPost,
		"/api/credit-card-installments",
		[]byte(`{"credit_card_id":1,"concept":"A","amount":10,"start_date":"2026-13-01","count":1}`),
	)
	if invalidStartDate.Code != http.StatusBadRequest {
		t.Fatalf("expected invalid start date to return 400, got %d", invalidStartDate.Code)
	}

	invalidCount := performRequest(
		router,
		http.MethodPost,
		"/api/credit-card-installments",
		[]byte(`{"credit_card_id":1,"concept":"A","amount":10,"start_date":"2026-01-01","count":0}`),
	)
	if invalidCount.Code != http.StatusBadRequest {
		t.Fatalf("expected invalid count to return 400, got %d", invalidCount.Code)
	}

	notFound := performRequest(router, http.MethodGet, "/api/credit-card-installments/999", nil)
	if notFound.Code != http.StatusNotFound {
		t.Fatalf("expected missing installment to return 404, got %d", notFound.Code)
	}
}

func seedCreditCardInstallmentDependencies(t *testing.T, router http.Handler) {
	t.Helper()

	seedCreditCardDependencies(t, router)

	creditCard := performRequest(
		router,
		http.MethodPost,
		"/api/credit-cards",
		[]byte(`{"bank_id":1,"person_id":1,"number":"1234 5678 9012 3456"}`),
	)
	if creditCard.Code != http.StatusCreated {
		t.Fatalf("expected credit card seed to return 201, got %d", creditCard.Code)
	}
}
