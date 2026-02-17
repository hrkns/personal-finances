package backend

import (
	"encoding/json"
	"net/http"
	"testing"
)

func TestTransactionCategoryCRUDFlow(t *testing.T) {
	application := newTestApplication(t)
	router := application.routes()

	createRoot := performRequest(router, http.MethodPost, "/api/transaction-categories", []byte(`{"name":"Salary"}`))
	if createRoot.Code != http.StatusCreated {
		t.Fatalf("expected 201 for root create, got %d", createRoot.Code)
	}

	var root transactionCategory
	if err := json.NewDecoder(createRoot.Body).Decode(&root); err != nil {
		t.Fatalf("decode created root: %v", err)
	}
	if root.ParentID != nil {
		t.Fatal("expected root category parent_id to be null")
	}

	createChild := performRequest(
		router,
		http.MethodPost,
		"/api/transaction-categories",
		[]byte(`{"name":"Job 1","parent_id":1}`),
	)
	if createChild.Code != http.StatusCreated {
		t.Fatalf("expected 201 for child create, got %d", createChild.Code)
	}

	var child transactionCategory
	if err := json.NewDecoder(createChild.Body).Decode(&child); err != nil {
		t.Fatalf("decode created child: %v", err)
	}
	if child.ParentID == nil || *child.ParentID != 1 {
		t.Fatalf("expected child parent_id to be 1, got %+v", child.ParentID)
	}
	if child.ParentName == nil || *child.ParentName != "Salary" {
		t.Fatalf("expected child parent_name to be Salary, got %+v", child.ParentName)
	}

	listResponse := performRequest(router, http.MethodGet, "/api/transaction-categories", nil)
	if listResponse.Code != http.StatusOK {
		t.Fatalf("expected 200 for list, got %d", listResponse.Code)
	}

	updateResponse := performRequest(
		router,
		http.MethodPut,
		"/api/transaction-categories/2",
		[]byte(`{"name":"Job One","parent_id":1}`),
	)
	if updateResponse.Code != http.StatusOK {
		t.Fatalf("expected 200 for update, got %d", updateResponse.Code)
	}

	deleteChild := performRequest(router, http.MethodDelete, "/api/transaction-categories/2", nil)
	if deleteChild.Code != http.StatusNoContent {
		t.Fatalf("expected 204 for child delete, got %d", deleteChild.Code)
	}

	deleteRoot := performRequest(router, http.MethodDelete, "/api/transaction-categories/1", nil)
	if deleteRoot.Code != http.StatusNoContent {
		t.Fatalf("expected 204 for root delete, got %d", deleteRoot.Code)
	}
}

func TestTransactionCategoryValidationErrors(t *testing.T) {
	application := newTestApplication(t)
	router := application.routes()

	invalidPayload := performRequest(router, http.MethodPost, "/api/transaction-categories", []byte(`{"name":"   "}`))
	if invalidPayload.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for blank name, got %d", invalidPayload.Code)
	}

	invalidParentID := performRequest(
		router,
		http.MethodPost,
		"/api/transaction-categories",
		[]byte(`{"name":"Job 1","parent_id":0}`),
	)
	if invalidParentID.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for invalid parent_id, got %d", invalidParentID.Code)
	}

	missingParent := performRequest(
		router,
		http.MethodPost,
		"/api/transaction-categories",
		[]byte(`{"name":"Job 1","parent_id":999}`),
	)
	if missingParent.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for missing parent category, got %d", missingParent.Code)
	}

	createRoot := performRequest(router, http.MethodPost, "/api/transaction-categories", []byte(`{"name":"Salary"}`))
	if createRoot.Code != http.StatusCreated {
		t.Fatalf("expected 201 for root create, got %d", createRoot.Code)
	}

	selfParent := performRequest(
		router,
		http.MethodPut,
		"/api/transaction-categories/1",
		[]byte(`{"name":"Salary","parent_id":1}`),
	)
	if selfParent.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for self parent, got %d", selfParent.Code)
	}

	invalidID := performRequest(router, http.MethodGet, "/api/transaction-categories/not-a-number", nil)
	if invalidID.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for invalid id path, got %d", invalidID.Code)
	}
}

func TestTransactionCategoryConflicts(t *testing.T) {
	application := newTestApplication(t)
	router := application.routes()

	createRoot := performRequest(router, http.MethodPost, "/api/transaction-categories", []byte(`{"name":"Salary"}`))
	if createRoot.Code != http.StatusCreated {
		t.Fatalf("expected 201 for root create, got %d", createRoot.Code)
	}

	duplicateRoot := performRequest(router, http.MethodPost, "/api/transaction-categories", []byte(`{"name":"salary"}`))
	if duplicateRoot.Code != http.StatusConflict {
		t.Fatalf("expected 409 for duplicate root category, got %d", duplicateRoot.Code)
	}

	createChild := performRequest(
		router,
		http.MethodPost,
		"/api/transaction-categories",
		[]byte(`{"name":"Job 1","parent_id":1}`),
	)
	if createChild.Code != http.StatusCreated {
		t.Fatalf("expected 201 for child create, got %d", createChild.Code)
	}

	deleteParentWithChild := performRequest(router, http.MethodDelete, "/api/transaction-categories/1", nil)
	if deleteParentWithChild.Code != http.StatusConflict {
		t.Fatalf("expected 409 for deleting parent with child categories, got %d", deleteParentWithChild.Code)
	}
}
