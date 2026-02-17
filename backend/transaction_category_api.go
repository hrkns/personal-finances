package backend

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
)

const (
	transactionCategoriesPath        = "/api/transaction-categories"
	transactionCategoriesPathByID    = "/api/transaction-categories/"
	transactionCategoryPathPattern   = "/api/transaction-categories/%d"
	duplicateTransactionCategoryCode = "duplicate_transaction_category"
)

type transactionCategory struct {
	ID         int64   `json:"id"`
	Name       string  `json:"name"`
	ParentID   *int64  `json:"parent_id"`
	ParentName *string `json:"parent_name"`
}

type transactionCategoryPayload struct {
	Name     string `json:"name"`
	ParentID *int64 `json:"parent_id"`
}

func (application app) registerTransactionCategoryRoutes(mux *http.ServeMux) {
	mux.HandleFunc(transactionCategoriesPath, application.transactionCategoriesHandler)
	mux.HandleFunc(transactionCategoriesPathByID, application.transactionCategoryByIDHandler)
}

func (application app) transactionCategoriesHandler(writer http.ResponseWriter, request *http.Request) {
	switch request.Method {
	case http.MethodGet:
		application.listTransactionCategories(writer)
	case http.MethodPost:
		application.createTransactionCategory(writer, request)
	default:
		methodNotAllowed(writer, http.MethodGet, http.MethodPost)
	}
}

func (application app) transactionCategoryByIDHandler(writer http.ResponseWriter, request *http.Request) {
	id, err := parseIDFromPath(request.URL.Path, transactionCategoriesPathByID)
	if err != nil {
		writeError(writer, http.StatusBadRequest, "invalid_id", "transaction category id must be a positive integer")
		return
	}

	switch request.Method {
	case http.MethodGet:
		application.getTransactionCategory(writer, id)
	case http.MethodPut:
		application.updateTransactionCategory(writer, request, id)
	case http.MethodDelete:
		application.deleteTransactionCategory(writer, id)
	default:
		methodNotAllowed(writer, http.MethodGet, http.MethodPut, http.MethodDelete)
	}
}

func (application app) listTransactionCategories(writer http.ResponseWriter) {
	rows, err := application.db.Query(`
		SELECT c.id, c.name, c.parent_id, p.name
		FROM transaction_categories c
		LEFT JOIN transaction_categories p ON p.id = c.parent_id
		ORDER BY c.id
	`)
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to load transaction categories")
		return
	}
	defer rows.Close()

	items := make([]transactionCategory, 0)
	for rows.Next() {
		item, scanErr := scanTransactionCategory(rows)
		if scanErr != nil {
			writeError(writer, http.StatusInternalServerError, "internal_error", "failed to read transaction categories")
			return
		}
		items = append(items, item)
	}

	writeJSON(writer, http.StatusOK, items)
}

func (application app) getTransactionCategory(writer http.ResponseWriter, id int64) {
	item, err := application.fetchTransactionCategory(id)
	if errors.Is(err, sql.ErrNoRows) {
		writeError(writer, http.StatusNotFound, "not_found", "transaction category not found")
		return
	}
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to load transaction category")
		return
	}

	writeJSON(writer, http.StatusOK, item)
}

func (application app) createTransactionCategory(writer http.ResponseWriter, request *http.Request) {
	payload, validationErr := decodeTransactionCategoryPayload(request)
	if validationErr != nil {
		writeError(writer, http.StatusBadRequest, "invalid_payload", validationErr.Error())
		return
	}

	if validationErr = application.validateTransactionCategoryPayload(payload, 0); validationErr != nil {
		writeError(writer, http.StatusBadRequest, "invalid_payload", validationErr.Error())
		return
	}

	result, err := application.db.Exec(
		`INSERT INTO transaction_categories(name, parent_id) VALUES (?, ?)`,
		payload.Name,
		payload.ParentID,
	)
	if err != nil {
		if isUniqueConstraintError(err) {
			writeError(writer, http.StatusConflict, duplicateTransactionCategoryCode, "category name must be unique under the same parent")
			return
		}
		if isForeignKeyConstraintError(err) {
			writeError(writer, http.StatusBadRequest, "invalid_payload", "parent category must exist")
			return
		}
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to create transaction category")
		return
	}

	id, err := result.LastInsertId()
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to read created transaction category id")
		return
	}

	created, err := application.fetchTransactionCategory(id)
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to load created transaction category")
		return
	}

	writer.Header().Set("Location", fmt.Sprintf(transactionCategoryPathPattern, id))
	writeJSON(writer, http.StatusCreated, created)
}

func (application app) updateTransactionCategory(writer http.ResponseWriter, request *http.Request, id int64) {
	payload, validationErr := decodeTransactionCategoryPayload(request)
	if validationErr != nil {
		writeError(writer, http.StatusBadRequest, "invalid_payload", validationErr.Error())
		return
	}

	if validationErr = application.validateTransactionCategoryPayload(payload, id); validationErr != nil {
		writeError(writer, http.StatusBadRequest, "invalid_payload", validationErr.Error())
		return
	}

	result, err := application.db.Exec(
		`UPDATE transaction_categories SET name = ?, parent_id = ? WHERE id = ?`,
		payload.Name,
		payload.ParentID,
		id,
	)
	if err != nil {
		if isUniqueConstraintError(err) {
			writeError(writer, http.StatusConflict, duplicateTransactionCategoryCode, "category name must be unique under the same parent")
			return
		}
		if isForeignKeyConstraintError(err) {
			writeError(writer, http.StatusBadRequest, "invalid_payload", "parent category must exist")
			return
		}
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to update transaction category")
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to read update result")
		return
	}
	if rowsAffected == 0 {
		writeError(writer, http.StatusNotFound, "not_found", "transaction category not found")
		return
	}

	updated, err := application.fetchTransactionCategory(id)
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to load updated transaction category")
		return
	}

	writeJSON(writer, http.StatusOK, updated)
}

func (application app) deleteTransactionCategory(writer http.ResponseWriter, id int64) {
	hasChildren, err := application.transactionCategoryHasChildren(id)
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to validate transaction category usage")
		return
	}
	if hasChildren {
		writeError(writer, http.StatusConflict, "category_in_use", "transaction category is in use")
		return
	}

	result, err := application.db.Exec(`DELETE FROM transaction_categories WHERE id = ?`, id)
	if err != nil {
		if isForeignKeyConstraintError(err) {
			writeError(writer, http.StatusConflict, "category_in_use", "transaction category is in use")
			return
		}
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to delete transaction category")
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to read delete result")
		return
	}
	if rowsAffected == 0 {
		writeError(writer, http.StatusNotFound, "not_found", "transaction category not found")
		return
	}

	writer.WriteHeader(http.StatusNoContent)
}

func decodeTransactionCategoryPayload(request *http.Request) (transactionCategoryPayload, error) {
	defer request.Body.Close()

	var payload transactionCategoryPayload
	if err := json.NewDecoder(request.Body).Decode(&payload); err != nil {
		return transactionCategoryPayload{}, fmt.Errorf("request body must be valid JSON")
	}

	payload.Name = strings.TrimSpace(payload.Name)
	if payload.Name == "" {
		return transactionCategoryPayload{}, fmt.Errorf("name is required")
	}

	if payload.ParentID != nil && *payload.ParentID <= 0 {
		return transactionCategoryPayload{}, fmt.Errorf("parent_id must be a positive integer")
	}

	return payload, nil
}

func (application app) validateTransactionCategoryPayload(payload transactionCategoryPayload, categoryID int64) error {
	if payload.ParentID == nil {
		return nil
	}

	if categoryID > 0 && *payload.ParentID == categoryID {
		return fmt.Errorf("category cannot be its own parent")
	}

	exists, err := application.transactionCategoryExists(*payload.ParentID)
	if err != nil {
		return fmt.Errorf("failed to validate parent category")
	}
	if !exists {
		return fmt.Errorf("parent category must exist")
	}

	return nil
}

func (application app) transactionCategoryExists(id int64) (bool, error) {
	var storedID int64
	err := application.db.QueryRow(`SELECT id FROM transaction_categories WHERE id = ?`, id).Scan(&storedID)
	if errors.Is(err, sql.ErrNoRows) {
		return false, nil
	}
	if err != nil {
		return false, err
	}

	return true, nil
}

func (application app) transactionCategoryHasChildren(id int64) (bool, error) {
	var count int64
	err := application.db.QueryRow(`SELECT COUNT(1) FROM transaction_categories WHERE parent_id = ?`, id).Scan(&count)
	if err != nil {
		return false, err
	}

	return count > 0, nil
}

func (application app) fetchTransactionCategory(id int64) (transactionCategory, error) {
	row := application.db.QueryRow(`
		SELECT c.id, c.name, c.parent_id, p.name
		FROM transaction_categories c
		LEFT JOIN transaction_categories p ON p.id = c.parent_id
		WHERE c.id = ?
	`, id)

	return scanTransactionCategory(row)
}

type scanner interface {
	Scan(dest ...any) error
}

func scanTransactionCategory(source scanner) (transactionCategory, error) {
	var item transactionCategory
	var parentID sql.NullInt64
	var parentName sql.NullString

	err := source.Scan(&item.ID, &item.Name, &parentID, &parentName)
	if err != nil {
		return transactionCategory{}, err
	}

	if parentID.Valid {
		id := parentID.Int64
		item.ParentID = &id
	}

	if parentName.Valid {
		name := parentName.String
		item.ParentName = &name
	}

	return item, nil
}
