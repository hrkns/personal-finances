package backend

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"net/http"
	"strings"
	"time"
)

const (
	transactionsPath       = "/api/transactions"
	transactionsPathByID   = "/api/transactions/"
	transactionPathPattern = "/api/transactions/%d"
)

type transaction struct {
	ID              int64   `json:"id"`
	TransactionDate string  `json:"transaction_date"`
	Type            string  `json:"type"`
	Amount          float64 `json:"amount"`
	Notes           *string `json:"notes"`
	PersonID        int64   `json:"person_id"`
	BankAccountID   int64   `json:"bank_account_id"`
	CategoryID      int64   `json:"category_id"`
}

type transactionPayload struct {
	TransactionDate string  `json:"transaction_date"`
	Type            string  `json:"type"`
	Amount          float64 `json:"amount"`
	Notes           *string `json:"notes"`
	PersonID        int64   `json:"person_id"`
	BankAccountID   int64   `json:"bank_account_id"`
	CategoryID      int64   `json:"category_id"`
}

func (application app) registerTransactionRoutes(mux *http.ServeMux) {
	mux.HandleFunc(transactionsPath, application.transactionsHandler)
	mux.HandleFunc(transactionsPathByID, application.transactionByIDHandler)
}

func (application app) transactionsHandler(writer http.ResponseWriter, request *http.Request) {
	switch request.Method {
	case http.MethodGet:
		application.listTransactions(writer)
	case http.MethodPost:
		application.createTransaction(writer, request)
	default:
		methodNotAllowed(writer, http.MethodGet, http.MethodPost)
	}
}

func (application app) transactionByIDHandler(writer http.ResponseWriter, request *http.Request) {
	id, err := parseIDFromPath(request.URL.Path, transactionsPathByID)
	if err != nil {
		writeError(writer, http.StatusBadRequest, "invalid_id", "transaction id must be a positive integer")
		return
	}

	switch request.Method {
	case http.MethodGet:
		application.getTransaction(writer, id)
	case http.MethodPut:
		application.updateTransaction(writer, request, id)
	case http.MethodDelete:
		application.deleteTransaction(writer, id)
	default:
		methodNotAllowed(writer, http.MethodGet, http.MethodPut, http.MethodDelete)
	}
}

func (application app) listTransactions(writer http.ResponseWriter) {
	rows, err := application.db.Query(`
		SELECT id, transaction_date, type, amount, notes, person_id, bank_account_id, category_id
		FROM transactions
		ORDER BY id
	`)
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to load transactions")
		return
	}
	defer rows.Close()

	items := make([]transaction, 0)
	for rows.Next() {
		item, scanErr := scanTransaction(rows)
		if scanErr != nil {
			writeError(writer, http.StatusInternalServerError, "internal_error", "failed to read transactions")
			return
		}
		items = append(items, item)
	}

	writeJSON(writer, http.StatusOK, items)
}

func (application app) getTransaction(writer http.ResponseWriter, id int64) {
	item, err := application.fetchTransaction(id)
	if errors.Is(err, sql.ErrNoRows) {
		writeError(writer, http.StatusNotFound, "not_found", "transaction not found")
		return
	}
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to load transaction")
		return
	}

	writeJSON(writer, http.StatusOK, item)
}

func (application app) createTransaction(writer http.ResponseWriter, request *http.Request) {
	payload, validationErr := decodeTransactionPayload(request)
	if validationErr != nil {
		writeError(writer, http.StatusBadRequest, "invalid_payload", validationErr.Error())
		return
	}

	if validationErr = application.validateTransactionPayload(payload); validationErr != nil {
		writeError(writer, http.StatusBadRequest, "invalid_payload", validationErr.Error())
		return
	}

	result, err := application.db.Exec(
		`INSERT INTO transactions(transaction_date, type, amount, notes, person_id, bank_account_id, category_id)
		 VALUES (?, ?, ?, ?, ?, ?, ?)`,
		payload.TransactionDate,
		payload.Type,
		payload.Amount,
		payload.Notes,
		payload.PersonID,
		payload.BankAccountID,
		payload.CategoryID,
	)
	if err != nil {
		if isForeignKeyConstraintError(err) {
			writeError(writer, http.StatusBadRequest, "invalid_payload", "person, bank account and transaction category must exist")
			return
		}
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to create transaction")
		return
	}

	id, err := result.LastInsertId()
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to read created transaction id")
		return
	}

	created, err := application.fetchTransaction(id)
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to load created transaction")
		return
	}

	writer.Header().Set("Location", fmt.Sprintf(transactionPathPattern, id))
	writeJSON(writer, http.StatusCreated, created)
}

func (application app) updateTransaction(writer http.ResponseWriter, request *http.Request, id int64) {
	payload, validationErr := decodeTransactionPayload(request)
	if validationErr != nil {
		writeError(writer, http.StatusBadRequest, "invalid_payload", validationErr.Error())
		return
	}

	if validationErr = application.validateTransactionPayload(payload); validationErr != nil {
		writeError(writer, http.StatusBadRequest, "invalid_payload", validationErr.Error())
		return
	}

	result, err := application.db.Exec(
		`UPDATE transactions
		 SET transaction_date = ?, type = ?, amount = ?, notes = ?, person_id = ?, bank_account_id = ?, category_id = ?
		 WHERE id = ?`,
		payload.TransactionDate,
		payload.Type,
		payload.Amount,
		payload.Notes,
		payload.PersonID,
		payload.BankAccountID,
		payload.CategoryID,
		id,
	)
	if err != nil {
		if isForeignKeyConstraintError(err) {
			writeError(writer, http.StatusBadRequest, "invalid_payload", "person, bank account and transaction category must exist")
			return
		}
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to update transaction")
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to read update result")
		return
	}
	if rowsAffected == 0 {
		writeError(writer, http.StatusNotFound, "not_found", "transaction not found")
		return
	}

	updated, err := application.fetchTransaction(id)
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to load updated transaction")
		return
	}

	writeJSON(writer, http.StatusOK, updated)
}

func (application app) deleteTransaction(writer http.ResponseWriter, id int64) {
	result, err := application.db.Exec(`DELETE FROM transactions WHERE id = ?`, id)
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to delete transaction")
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to read delete result")
		return
	}
	if rowsAffected == 0 {
		writeError(writer, http.StatusNotFound, "not_found", "transaction not found")
		return
	}

	writer.WriteHeader(http.StatusNoContent)
}

func decodeTransactionPayload(request *http.Request) (transactionPayload, error) {
	defer request.Body.Close()

	var payload transactionPayload
	if err := json.NewDecoder(request.Body).Decode(&payload); err != nil {
		return transactionPayload{}, fmt.Errorf("request body must be valid JSON")
	}

	payload.TransactionDate = strings.TrimSpace(payload.TransactionDate)
	if payload.TransactionDate == "" {
		return transactionPayload{}, fmt.Errorf("transaction_date is required")
	}
	if _, err := time.Parse("2006-01-02", payload.TransactionDate); err != nil {
		return transactionPayload{}, fmt.Errorf("transaction_date must be a valid date in YYYY-MM-DD format")
	}

	payload.Type = strings.ToLower(strings.TrimSpace(payload.Type))
	if payload.Type != "income" && payload.Type != "expense" {
		return transactionPayload{}, fmt.Errorf("type must be either income or expense")
	}

	if math.IsNaN(payload.Amount) || math.IsInf(payload.Amount, 0) || payload.Amount <= 0 {
		return transactionPayload{}, fmt.Errorf("amount must be greater than zero")
	}

	if payload.PersonID <= 0 {
		return transactionPayload{}, fmt.Errorf("person_id must be a positive integer")
	}
	if payload.BankAccountID <= 0 {
		return transactionPayload{}, fmt.Errorf("bank_account_id must be a positive integer")
	}
	if payload.CategoryID <= 0 {
		return transactionPayload{}, fmt.Errorf("category_id must be a positive integer")
	}

	if payload.Notes != nil {
		trimmedNotes := strings.TrimSpace(*payload.Notes)
		if trimmedNotes == "" {
			payload.Notes = nil
		} else {
			payload.Notes = &trimmedNotes
		}
	}

	return payload, nil
}

func (application app) validateTransactionPayload(payload transactionPayload) error {
	personExists, err := application.personExists(payload.PersonID)
	if err != nil {
		return fmt.Errorf("failed to validate person")
	}
	if !personExists {
		return fmt.Errorf("person must exist")
	}

	bankAccountExists, err := application.bankAccountExists(payload.BankAccountID)
	if err != nil {
		return fmt.Errorf("failed to validate bank account")
	}
	if !bankAccountExists {
		return fmt.Errorf("bank account must exist")
	}

	categoryExists, err := application.transactionCategoryExists(payload.CategoryID)
	if err != nil {
		return fmt.Errorf("failed to validate transaction category")
	}
	if !categoryExists {
		return fmt.Errorf("transaction category must exist")
	}

	return nil
}

func (application app) personExists(id int64) (bool, error) {
	var storedID int64
	err := application.db.QueryRow(`SELECT id FROM people WHERE id = ?`, id).Scan(&storedID)
	if errors.Is(err, sql.ErrNoRows) {
		return false, nil
	}
	if err != nil {
		return false, err
	}

	return true, nil
}

func (application app) bankAccountExists(id int64) (bool, error) {
	var storedID int64
	err := application.db.QueryRow(`SELECT id FROM bank_accounts WHERE id = ?`, id).Scan(&storedID)
	if errors.Is(err, sql.ErrNoRows) {
		return false, nil
	}
	if err != nil {
		return false, err
	}

	return true, nil
}

func (application app) fetchTransaction(id int64) (transaction, error) {
	row := application.db.QueryRow(`
		SELECT id, transaction_date, type, amount, notes, person_id, bank_account_id, category_id
		FROM transactions
		WHERE id = ?
	`, id)

	return scanTransaction(row)
}

func scanTransaction(source scanner) (transaction, error) {
	var item transaction
	var notes sql.NullString

	err := source.Scan(
		&item.ID,
		&item.TransactionDate,
		&item.Type,
		&item.Amount,
		&notes,
		&item.PersonID,
		&item.BankAccountID,
		&item.CategoryID,
	)
	if err != nil {
		return transaction{}, err
	}

	if notes.Valid {
		value := notes.String
		item.Notes = &value
	}

	return item, nil
}
