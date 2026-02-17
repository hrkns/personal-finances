package backend

import (
	"encoding/json"
	"net/http"
	"testing"
)

func TestCountriesListEndpoint(t *testing.T) {
	application := newTestApplication(t)
	router := application.routes()

	response := performRequest(router, http.MethodGet, "/api/countries", nil)
	if response.Code != http.StatusOK {
		t.Fatalf("expected 200 for countries list, got %d", response.Code)
	}

	var countries []country
	if err := json.NewDecoder(response.Body).Decode(&countries); err != nil {
		t.Fatalf("decode countries response: %v", err)
	}
	if len(countries) == 0 {
		t.Fatal("expected seeded countries in response")
	}

	foundUS := false
	for _, item := range countries {
		if item.Code == "US" && item.Name != "" {
			foundUS = true
			break
		}
	}
	if !foundUS {
		t.Fatal("expected US country in response")
	}
}
