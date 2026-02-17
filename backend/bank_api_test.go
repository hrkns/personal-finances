package backend

import (
	"encoding/json"
	"net/http"
	"testing"
)

func TestBankCRUDFlow(t *testing.T) {
	application := newTestApplication(t)
	router := application.routes()

	createBody := []byte(`{"name":"Bank of Test","country":"us"}`)
	createResponse := performRequest(router, http.MethodPost, "/api/banks", createBody)
	if createResponse.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d", createResponse.Code)
	}
	if createResponse.Header().Get("Location") == "" {
		t.Fatal("expected Location header for created bank")
	}

	var created bank
	if err := json.NewDecoder(createResponse.Body).Decode(&created); err != nil {
		t.Fatalf("decode created response: %v", err)
	}
	if created.Country != "US" {
		t.Fatalf("expected country to be normalized to US, got %s", created.Country)
	}

	listResponse := performRequest(router, http.MethodGet, "/api/banks", nil)
	if listResponse.Code != http.StatusOK {
		t.Fatalf("expected 200 for list, got %d", listResponse.Code)
	}

	updateBody := []byte(`{"name":"Bank of Test Updated","country":"CA"}`)
	updateResponse := performRequest(router, http.MethodPut, "/api/banks/1", updateBody)
	if updateResponse.Code != http.StatusOK {
		t.Fatalf("expected 200 for update, got %d", updateResponse.Code)
	}

	deleteResponse := performRequest(router, http.MethodDelete, "/api/banks/1", nil)
	if deleteResponse.Code != http.StatusNoContent {
		t.Fatalf("expected 204 for delete, got %d", deleteResponse.Code)
	}

	getAfterDelete := performRequest(router, http.MethodGet, "/api/banks/1", nil)
	if getAfterDelete.Code != http.StatusNotFound {
		t.Fatalf("expected 404 after delete, got %d", getAfterDelete.Code)
	}
}

func TestBankUniqueConstraintByNameAndCountry(t *testing.T) {
	application := newTestApplication(t)
	router := application.routes()

	firstBody := []byte(`{"name":"Global Bank","country":"US"}`)
	first := performRequest(router, http.MethodPost, "/api/banks", firstBody)
	if first.Code != http.StatusCreated {
		t.Fatalf("expected first create to return 201, got %d", first.Code)
	}

	sameNameCountry := []byte(`{"name":"Global Bank","country":"US"}`)
	duplicate := performRequest(router, http.MethodPost, "/api/banks", sameNameCountry)
	if duplicate.Code != http.StatusConflict {
		t.Fatalf("expected duplicate create to return 409, got %d", duplicate.Code)
	}

	sameNameDifferentCountry := []byte(`{"name":"Global Bank","country":"CA"}`)
	allowed := performRequest(router, http.MethodPost, "/api/banks", sameNameDifferentCountry)
	if allowed.Code != http.StatusCreated {
		t.Fatalf("expected same name in different country to return 201, got %d", allowed.Code)
	}
}

func TestBankValidationErrors(t *testing.T) {
	application := newTestApplication(t)
	router := application.routes()

	invalidCountry := []byte(`{"name":"Local Bank","country":"ZZ"}`)
	invalidCountryResponse := performRequest(router, http.MethodPost, "/api/banks", invalidCountry)
	if invalidCountryResponse.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for invalid country, got %d", invalidCountryResponse.Code)
	}

	invalidIDResponse := performRequest(router, http.MethodGet, "/api/banks/not-a-number", nil)
	if invalidIDResponse.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for invalid id, got %d", invalidIDResponse.Code)
	}
}
