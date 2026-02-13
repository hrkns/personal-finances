package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"testing"
)

func newTestApplication(t *testing.T) app {
	t.Helper()
	dbPath := filepath.Join(t.TempDir(), "test.db")
	db, err := setupDatabase(dbPath)
	if err != nil {
		t.Fatalf("setup database: %v", err)
	}
	t.Cleanup(func() {
		db.Close()
	})

	return app{db: db}
}

func performRequest(handler http.Handler, method string, path string, body []byte) *httptest.ResponseRecorder {
	request := httptest.NewRequest(method, path, bytes.NewReader(body))
	if body != nil {
		request.Header.Set("Content-Type", "application/json")
	}
	responseRecorder := httptest.NewRecorder()
	handler.ServeHTTP(responseRecorder, request)
	return responseRecorder
}

func TestHealthHandler(t *testing.T) {
	response := performRequest(http.HandlerFunc(healthHandler), http.MethodGet, "/api/health", nil)

	if response.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", response.Code)
	}
}

func TestCurrencyCRUDFlow(t *testing.T) {
	application := newTestApplication(t)
	router := application.routes()

	createBody := []byte(`{"name":"US Dollar","code":"usd"}`)
	createResponse := performRequest(router, http.MethodPost, "/api/currencies", createBody)
	if createResponse.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d", createResponse.Code)
	}
	if createResponse.Header().Get("Location") == "" {
		t.Fatal("expected Location header for created currency")
	}

	var created currency
	if err := json.NewDecoder(createResponse.Body).Decode(&created); err != nil {
		t.Fatalf("decode created response: %v", err)
	}
	if created.Code != "USD" {
		t.Fatalf("expected code to be normalized to USD, got %s", created.Code)
	}

	listResponse := performRequest(router, http.MethodGet, "/api/currencies", nil)
	if listResponse.Code != http.StatusOK {
		t.Fatalf("expected 200 for list, got %d", listResponse.Code)
	}

	updateBody := []byte(`{"name":"US Dollar Updated","code":"USDX"}`)
	updateResponse := performRequest(router, http.MethodPut, "/api/currencies/1", updateBody)
	if updateResponse.Code != http.StatusOK {
		t.Fatalf("expected 200 for update, got %d", updateResponse.Code)
	}

	deleteResponse := performRequest(router, http.MethodDelete, "/api/currencies/1", nil)
	if deleteResponse.Code != http.StatusNoContent {
		t.Fatalf("expected 204 for delete, got %d", deleteResponse.Code)
	}

	getAfterDelete := performRequest(router, http.MethodGet, "/api/currencies/1", nil)
	if getAfterDelete.Code != http.StatusNotFound {
		t.Fatalf("expected 404 after delete, got %d", getAfterDelete.Code)
	}
}

func TestCurrencyUniqueConstraint(t *testing.T) {
	application := newTestApplication(t)
	router := application.routes()

	body := []byte(`{"name":"Euro","code":"EUR"}`)
	first := performRequest(router, http.MethodPost, "/api/currencies", body)
	if first.Code != http.StatusCreated {
		t.Fatalf("expected first create to return 201, got %d", first.Code)
	}

	duplicate := performRequest(router, http.MethodPost, "/api/currencies", body)
	if duplicate.Code != http.StatusConflict {
		t.Fatalf("expected duplicate create to return 409, got %d", duplicate.Code)
	}
}

func TestCurrencyInvalidIDReturnsBadRequest(t *testing.T) {
	application := newTestApplication(t)
	router := application.routes()

	response := performRequest(router, http.MethodGet, "/api/currencies/not-a-number", nil)
	if response.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for invalid id, got %d", response.Code)
	}
}
