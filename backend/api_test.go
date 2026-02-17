package backend

import (
	"net/http"
	"testing"
)

func TestHealthHandler(t *testing.T) {
	response := performRequest(http.HandlerFunc(healthHandler), http.MethodGet, "/api/health", nil)

	if response.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", response.Code)
	}
}
