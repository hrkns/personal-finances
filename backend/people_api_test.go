package backend

import (
	"encoding/json"
	"net/http"
	"testing"
)

func TestPersonCRUDFlow(t *testing.T) {
	application := newTestApplication(t)
	router := application.routes()

	createBody := []byte(`{"name":"John Doe"}`)
	createResponse := performRequest(router, http.MethodPost, "/api/people", createBody)
	if createResponse.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d", createResponse.Code)
	}
	if createResponse.Header().Get("Location") == "" {
		t.Fatal("expected Location header for created person")
	}

	var created person
	if err := json.NewDecoder(createResponse.Body).Decode(&created); err != nil {
		t.Fatalf("decode created response: %v", err)
	}
	if created.Name != "John Doe" {
		t.Fatalf("expected name to be John Doe, got %s", created.Name)
	}

	listResponse := performRequest(router, http.MethodGet, "/api/people", nil)
	if listResponse.Code != http.StatusOK {
		t.Fatalf("expected 200 for list, got %d", listResponse.Code)
	}

	updateBody := []byte(`{"name":"Jane Doe"}`)
	updateResponse := performRequest(router, http.MethodPut, "/api/people/1", updateBody)
	if updateResponse.Code != http.StatusOK {
		t.Fatalf("expected 200 for update, got %d", updateResponse.Code)
	}

	deleteResponse := performRequest(router, http.MethodDelete, "/api/people/1", nil)
	if deleteResponse.Code != http.StatusNoContent {
		t.Fatalf("expected 204 for delete, got %d", deleteResponse.Code)
	}

	getAfterDelete := performRequest(router, http.MethodGet, "/api/people/1", nil)
	if getAfterDelete.Code != http.StatusNotFound {
		t.Fatalf("expected 404 after delete, got %d", getAfterDelete.Code)
	}
}

func TestPersonValidationErrors(t *testing.T) {
	application := newTestApplication(t)
	router := application.routes()

	invalidPayload := performRequest(router, http.MethodPost, "/api/people", []byte(`{"name":"   "}`))
	if invalidPayload.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for invalid payload, got %d", invalidPayload.Code)
	}

	invalidID := performRequest(router, http.MethodGet, "/api/people/not-a-number", nil)
	if invalidID.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for invalid id, got %d", invalidID.Code)
	}
}
