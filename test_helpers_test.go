package main

import (
	"bytes"
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