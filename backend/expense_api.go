package backend

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"slices"
	"strings"
)

const (
	expensesPath         = "/api/expenses"
	expensesPathByID     = "/api/expenses/"
	expensePathPattern   = "/api/expenses/%d"
	duplicateExpenseCode = "duplicate_expense"
)

var validExpenseFrequencies = []string{"daily", "weekly", "monthly", "annually"}

type expense struct {
	ID        int64  `json:"id"`
	Name      string `json:"name"`
	Frequency string `json:"frequency"`
}

type expensePayload struct {
	Name      string `json:"name"`
	Frequency string `json:"frequency"`
}

func (application app) registerExpenseRoutes(mux *http.ServeMux) {
	mux.HandleFunc(expensesPath, application.expensesHandler)
	mux.HandleFunc(expensesPathByID, application.expenseByIDHandler)
}

func (application app) expensesHandler(writer http.ResponseWriter, request *http.Request) {
	switch request.Method {
	case http.MethodGet:
		application.listExpenses(writer)
	case http.MethodPost:
		application.createExpense(writer, request)
	default:
		methodNotAllowed(writer, http.MethodGet, http.MethodPost)
	}
}

func (application app) expenseByIDHandler(writer http.ResponseWriter, request *http.Request) {
	id, err := parseIDFromPath(request.URL.Path, expensesPathByID)
	if err != nil {
		writeError(writer, http.StatusBadRequest, "invalid_id", "expense id must be a positive integer")
		return
	}

	switch request.Method {
	case http.MethodGet:
		application.getExpense(writer, id)
	case http.MethodPut:
		application.updateExpense(writer, request, id)
	case http.MethodDelete:
		application.deleteExpense(writer, id)
	default:
		methodNotAllowed(writer, http.MethodGet, http.MethodPut, http.MethodDelete)
	}
}

func (application app) listExpenses(writer http.ResponseWriter) {
	rows, err := application.db.Query(`SELECT id, name, frequency FROM expenses ORDER BY id`)
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to load expenses")
		return
	}
	defer rows.Close()

	items := make([]expense, 0)
	for rows.Next() {
		var item expense
		if scanErr := rows.Scan(&item.ID, &item.Name, &item.Frequency); scanErr != nil {
			writeError(writer, http.StatusInternalServerError, "internal_error", "failed to read expenses")
			return
		}
		items = append(items, item)
	}

	writeJSON(writer, http.StatusOK, items)
}

func (application app) getExpense(writer http.ResponseWriter, id int64) {
	var item expense
	err := application.db.QueryRow(`SELECT id, name, frequency FROM expenses WHERE id = ?`, id).Scan(&item.ID, &item.Name, &item.Frequency)
	if errors.Is(err, sql.ErrNoRows) {
		writeError(writer, http.StatusNotFound, "not_found", "expense not found")
		return
	}
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to load expense")
		return
	}

	writeJSON(writer, http.StatusOK, item)
}

func (application app) createExpense(writer http.ResponseWriter, request *http.Request) {
	payload, validationErr := decodeExpensePayload(request)
	if validationErr != nil {
		writeError(writer, http.StatusBadRequest, "invalid_payload", validationErr.Error())
		return
	}

	result, err := application.db.Exec(`INSERT INTO expenses(name, frequency) VALUES (?, ?)`, payload.Name, payload.Frequency)
	if err != nil {
		if isUniqueConstraintError(err) {
			writeError(writer, http.StatusConflict, duplicateExpenseCode, "expense name must be unique")
			return
		}
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to create expense")
		return
	}

	id, err := result.LastInsertId()
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to read created expense id")
		return
	}

	created := expense{ID: id, Name: payload.Name, Frequency: payload.Frequency}
	writer.Header().Set("Location", fmt.Sprintf(expensePathPattern, id))
	writeJSON(writer, http.StatusCreated, created)
}

func (application app) updateExpense(writer http.ResponseWriter, request *http.Request, id int64) {
	payload, validationErr := decodeExpensePayload(request)
	if validationErr != nil {
		writeError(writer, http.StatusBadRequest, "invalid_payload", validationErr.Error())
		return
	}

	result, err := application.db.Exec(`UPDATE expenses SET name = ?, frequency = ? WHERE id = ?`, payload.Name, payload.Frequency, id)
	if err != nil {
		if isUniqueConstraintError(err) {
			writeError(writer, http.StatusConflict, duplicateExpenseCode, "expense name must be unique")
			return
		}
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to update expense")
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to read update result")
		return
	}
	if rowsAffected == 0 {
		writeError(writer, http.StatusNotFound, "not_found", "expense not found")
		return
	}

	updated := expense{ID: id, Name: payload.Name, Frequency: payload.Frequency}
	writeJSON(writer, http.StatusOK, updated)
}

func (application app) deleteExpense(writer http.ResponseWriter, id int64) {
	result, err := application.db.Exec(`DELETE FROM expenses WHERE id = ?`, id)
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to delete expense")
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to read delete result")
		return
	}
	if rowsAffected == 0 {
		writeError(writer, http.StatusNotFound, "not_found", "expense not found")
		return
	}

	writer.WriteHeader(http.StatusNoContent)
}

func decodeExpensePayload(request *http.Request) (expensePayload, error) {
	defer request.Body.Close()

	var payload expensePayload
	if err := json.NewDecoder(request.Body).Decode(&payload); err != nil {
		return expensePayload{}, fmt.Errorf("request body must be valid JSON")
	}

	payload.Name = strings.TrimSpace(payload.Name)
	payload.Frequency = strings.ToLower(strings.TrimSpace(payload.Frequency))

	if payload.Name == "" {
		return expensePayload{}, fmt.Errorf("name is required")
	}
	if payload.Frequency == "" {
		return expensePayload{}, fmt.Errorf("frequency is required")
	}
	if !slices.Contains(validExpenseFrequencies, payload.Frequency) {
		return expensePayload{}, fmt.Errorf("frequency must be one of: daily, weekly, monthly, annually")
	}

	return payload, nil
}
