package backend

import (
	"encoding/json"
	"net/http"
	"testing"
)

func TestExpenseCRUDFlow(t *testing.T) {
	application := newTestApplication(t)
	router := application.routes()

	createResponse := performRequest(router, http.MethodPost, "/api/expenses", []byte(`{"name":"Rent","frequency":"monthly"}`))
	if createResponse.Code != http.StatusCreated {
		t.Fatalf("expected 201 for create, got %d", createResponse.Code)
	}
	if createResponse.Header().Get("Location") == "" {
		t.Fatal("expected Location header for created expense")
	}

	var created expense
	if err := json.NewDecoder(createResponse.Body).Decode(&created); err != nil {
		t.Fatalf("decode created response: %v", err)
	}
	if created.Name != "Rent" {
		t.Fatalf("expected name Rent, got %s", created.Name)
	}
	if created.Frequency != "monthly" {
		t.Fatalf("expected frequency monthly, got %s", created.Frequency)
	}

	listResponse := performRequest(router, http.MethodGet, "/api/expenses", nil)
	if listResponse.Code != http.StatusOK {
		t.Fatalf("expected 200 for list, got %d", listResponse.Code)
	}

	updateResponse := performRequest(router, http.MethodPut, "/api/expenses/1", []byte(`{"name":"Gym","frequency":"weekly"}`))
	if updateResponse.Code != http.StatusOK {
		t.Fatalf("expected 200 for update, got %d", updateResponse.Code)
	}

	deleteResponse := performRequest(router, http.MethodDelete, "/api/expenses/1", nil)
	if deleteResponse.Code != http.StatusNoContent {
		t.Fatalf("expected 204 for delete, got %d", deleteResponse.Code)
	}

	getAfterDelete := performRequest(router, http.MethodGet, "/api/expenses/1", nil)
	if getAfterDelete.Code != http.StatusNotFound {
		t.Fatalf("expected 404 after delete, got %d", getAfterDelete.Code)
	}
}

func TestExpenseValidationErrors(t *testing.T) {
	application := newTestApplication(t)
	router := application.routes()

	blankName := performRequest(router, http.MethodPost, "/api/expenses", []byte(`{"name":"   ","frequency":"monthly"}`))
	if blankName.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for blank name, got %d", blankName.Code)
	}

	missingFrequency := performRequest(router, http.MethodPost, "/api/expenses", []byte(`{"name":"Rent"}`))
	if missingFrequency.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for missing frequency, got %d", missingFrequency.Code)
	}

	invalidFrequency := performRequest(router, http.MethodPost, "/api/expenses", []byte(`{"name":"Rent","frequency":"biweekly"}`))
	if invalidFrequency.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for invalid frequency, got %d", invalidFrequency.Code)
	}

	invalidID := performRequest(router, http.MethodGet, "/api/expenses/not-a-number", nil)
	if invalidID.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for invalid id, got %d", invalidID.Code)
	}
}

func TestExpenseUniqueConstraint(t *testing.T) {
	application := newTestApplication(t)
	router := application.routes()

	first := performRequest(router, http.MethodPost, "/api/expenses", []byte(`{"name":"Rent","frequency":"monthly"}`))
	if first.Code != http.StatusCreated {
		t.Fatalf("expected first create to return 201, got %d", first.Code)
	}

	duplicate := performRequest(router, http.MethodPost, "/api/expenses", []byte(`{"name":"rent","frequency":"annually"}`))
	if duplicate.Code != http.StatusConflict {
		t.Fatalf("expected duplicate create to return 409, got %d", duplicate.Code)
	}
}
