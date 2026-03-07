package backend

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"
)

const (
	expensePaymentsPath       = "/api/expense-payments"
	expensePaymentsPathByID   = "/api/expense-payments/"
	expensePaymentPathPattern = "/api/expense-payments/%d"
)

type expensePayment struct {
	ID         int64   `json:"id"`
	ExpenseID  int64   `json:"expense_id"`
	Amount     float64 `json:"amount"`
	CurrencyID int64   `json:"currency_id"`
	Date       string  `json:"date"`
}

type expensePaymentPayload struct {
	ExpenseID  int64   `json:"expense_id"`
	Amount     float64 `json:"amount"`
	CurrencyID int64   `json:"currency_id"`
	Date       string  `json:"date"`
}

func (application app) registerExpensePaymentRoutes(mux *http.ServeMux) {
	mux.HandleFunc(expensePaymentsPath, application.expensePaymentsHandler)
	mux.HandleFunc(expensePaymentsPathByID, application.expensePaymentByIDHandler)
}

func (application app) expensePaymentsHandler(writer http.ResponseWriter, request *http.Request) {
	switch request.Method {
	case http.MethodGet:
		application.listExpensePayments(writer)
	case http.MethodPost:
		application.createExpensePayment(writer, request)
	default:
		methodNotAllowed(writer, http.MethodGet, http.MethodPost)
	}
}

func (application app) expensePaymentByIDHandler(writer http.ResponseWriter, request *http.Request) {
	id, err := parseIDFromPath(request.URL.Path, expensePaymentsPathByID)
	if err != nil {
		writeError(writer, http.StatusBadRequest, "invalid_id", "expense payment id must be a positive integer")
		return
	}

	switch request.Method {
	case http.MethodGet:
		application.getExpensePayment(writer, id)
	case http.MethodPut:
		application.updateExpensePayment(writer, request, id)
	case http.MethodDelete:
		application.deleteExpensePayment(writer, id)
	default:
		methodNotAllowed(writer, http.MethodGet, http.MethodPut, http.MethodDelete)
	}
}

func (application app) listExpensePayments(writer http.ResponseWriter) {
	rows, err := application.db.Query(`SELECT id, expense_id, amount, currency_id, payment_date FROM expense_payments ORDER BY id`)
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to load expense payments")
		return
	}
	defer rows.Close()

	items := make([]expensePayment, 0)
	for rows.Next() {
		item, scanErr := scanExpensePayment(rows)
		if scanErr != nil {
			writeError(writer, http.StatusInternalServerError, "internal_error", "failed to read expense payments")
			return
		}
		items = append(items, item)
	}

	if err = rows.Err(); err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to read expense payments")
		return
	}

	writeJSON(writer, http.StatusOK, items)
}

func (application app) getExpensePayment(writer http.ResponseWriter, id int64) {
	item, err := application.fetchExpensePayment(id)
	if errors.Is(err, sql.ErrNoRows) {
		writeError(writer, http.StatusNotFound, "not_found", "expense payment not found")
		return
	}
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to load expense payment")
		return
	}

	writeJSON(writer, http.StatusOK, item)
}

func (application app) createExpensePayment(writer http.ResponseWriter, request *http.Request) {
	payload, validationErr := decodeExpensePaymentPayload(request)
	if validationErr != nil {
		writeError(writer, http.StatusBadRequest, "invalid_payload", validationErr.Error())
		return
	}

	expenseFrequency, err := application.fetchExpenseFrequency(payload.ExpenseID)
	if errors.Is(err, sql.ErrNoRows) {
		writeError(writer, http.StatusBadRequest, "invalid_payload", "expense and currency must exist")
		return
	}
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to validate expense payment period")
		return
	}

	hasDuplicate, err := application.hasExpensePaymentInSamePeriod(payload, expenseFrequency, 0)
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to validate expense payment period")
		return
	}
	if hasDuplicate {
		writeError(writer, http.StatusConflict, "duplicate_expense_payment_period", fmt.Sprintf("an expense payment already exists in the same %s period", expenseFrequency))
		return
	}

	result, err := application.db.Exec(
		`INSERT INTO expense_payments(expense_id, amount, currency_id, payment_date) VALUES (?, ?, ?, ?)`,
		payload.ExpenseID,
		payload.Amount,
		payload.CurrencyID,
		payload.Date,
	)
	if err != nil {
		if isForeignKeyConstraintError(err) {
			writeError(writer, http.StatusBadRequest, "invalid_payload", "expense and currency must exist")
			return
		}
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to create expense payment")
		return
	}

	id, err := result.LastInsertId()
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to read created expense payment id")
		return
	}

	created, err := application.fetchExpensePayment(id)
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to load created expense payment")
		return
	}

	writer.Header().Set("Location", fmt.Sprintf(expensePaymentPathPattern, id))
	writeJSON(writer, http.StatusCreated, created)
}

func (application app) updateExpensePayment(writer http.ResponseWriter, request *http.Request, id int64) {
	payload, validationErr := decodeExpensePaymentPayload(request)
	if validationErr != nil {
		writeError(writer, http.StatusBadRequest, "invalid_payload", validationErr.Error())
		return
	}

	_, err := application.fetchExpensePayment(id)
	if errors.Is(err, sql.ErrNoRows) {
		writeError(writer, http.StatusNotFound, "not_found", "expense payment not found")
		return
	}
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to load expense payment")
		return
	}

	expenseFrequency, err := application.fetchExpenseFrequency(payload.ExpenseID)
	if errors.Is(err, sql.ErrNoRows) {
		writeError(writer, http.StatusBadRequest, "invalid_payload", "expense and currency must exist")
		return
	}
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to validate expense payment period")
		return
	}

	hasDuplicate, err := application.hasExpensePaymentInSamePeriod(payload, expenseFrequency, id)
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to validate expense payment period")
		return
	}
	if hasDuplicate {
		writeError(writer, http.StatusConflict, "duplicate_expense_payment_period", fmt.Sprintf("an expense payment already exists in the same %s period", expenseFrequency))
		return
	}

	result, err := application.db.Exec(
		`UPDATE expense_payments SET expense_id = ?, amount = ?, currency_id = ?, payment_date = ? WHERE id = ?`,
		payload.ExpenseID,
		payload.Amount,
		payload.CurrencyID,
		payload.Date,
		id,
	)
	if err != nil {
		if isForeignKeyConstraintError(err) {
			writeError(writer, http.StatusBadRequest, "invalid_payload", "expense and currency must exist")
			return
		}
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to update expense payment")
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to read update result")
		return
	}
	if rowsAffected == 0 {
		writeError(writer, http.StatusNotFound, "not_found", "expense payment not found")
		return
	}

	updated, err := application.fetchExpensePayment(id)
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to load updated expense payment")
		return
	}

	writeJSON(writer, http.StatusOK, updated)
}

func (application app) deleteExpensePayment(writer http.ResponseWriter, id int64) {
	result, err := application.db.Exec(`DELETE FROM expense_payments WHERE id = ?`, id)
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to delete expense payment")
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to read delete result")
		return
	}
	if rowsAffected == 0 {
		writeError(writer, http.StatusNotFound, "not_found", "expense payment not found")
		return
	}

	writer.WriteHeader(http.StatusNoContent)
}

func decodeExpensePaymentPayload(request *http.Request) (expensePaymentPayload, error) {
	defer request.Body.Close()

	var payload expensePaymentPayload
	if err := json.NewDecoder(request.Body).Decode(&payload); err != nil {
		return expensePaymentPayload{}, fmt.Errorf("request body must be valid JSON")
	}

	payload.Date = strings.TrimSpace(payload.Date)

	if payload.ExpenseID <= 0 {
		return expensePaymentPayload{}, fmt.Errorf("expense_id must be a positive integer")
	}
	if payload.Amount <= 0 {
		return expensePaymentPayload{}, fmt.Errorf("amount must be greater than zero")
	}
	if payload.CurrencyID <= 0 {
		return expensePaymentPayload{}, fmt.Errorf("currency_id must be a positive integer")
	}
	if !isValidISODate(payload.Date) {
		return expensePaymentPayload{}, fmt.Errorf("date must be a valid date in YYYY-MM-DD format")
	}

	return payload, nil
}

func (application app) fetchExpensePayment(id int64) (expensePayment, error) {
	row := application.db.QueryRow(
		`SELECT id, expense_id, amount, currency_id, payment_date FROM expense_payments WHERE id = ?`,
		id,
	)

	item, err := scanExpensePayment(row)
	if err != nil {
		return expensePayment{}, err
	}

	return item, nil
}

func scanExpensePayment(source scanner) (expensePayment, error) {
	var item expensePayment
	if err := source.Scan(&item.ID, &item.ExpenseID, &item.Amount, &item.CurrencyID, &item.Date); err != nil {
		return expensePayment{}, err
	}

	return item, nil
}

func (application app) hasExpensePaymentInSamePeriod(payload expensePaymentPayload, expenseFrequency string, paymentID int64) (bool, error) {
	payloadDate, _ := time.Parse("2006-01-02", payload.Date)

	query := `SELECT id, payment_date FROM expense_payments WHERE expense_id = ?`
	args := []any{payload.ExpenseID}
	if paymentID > 0 {
		query += ` AND id != ?`
		args = append(args, paymentID)
	}

	rows, err := application.db.Query(query, args...)
	if err != nil {
		return false, err
	}
	defer rows.Close()

	for rows.Next() {
		var existingID int64
		var existingDateRaw string
		if scanErr := rows.Scan(&existingID, &existingDateRaw); scanErr != nil {
			return false, scanErr
		}

		existingDate, parseErr := time.Parse("2006-01-02", existingDateRaw)
		if parseErr != nil {
			return false, parseErr
		}

		if isSameExpenseFrequencyPeriod(payloadDate, existingDate, expenseFrequency) {
			return true, nil
		}
	}

	if err = rows.Err(); err != nil {
		return false, err
	}

	return false, nil
}

func (application app) fetchExpenseFrequency(expenseID int64) (string, error) {
	var frequency string
	err := application.db.QueryRow(`SELECT frequency FROM expenses WHERE id = ?`, expenseID).Scan(&frequency)
	if err != nil {
		return "", err
	}

	return frequency, nil
}

func isSameExpenseFrequencyPeriod(left time.Time, right time.Time, frequency string) bool {
	switch frequency {
	case "daily":
		return left.Year() == right.Year() && left.Month() == right.Month() && left.Day() == right.Day()
	case "weekly":
		leftYear, leftWeek := left.ISOWeek()
		rightYear, rightWeek := right.ISOWeek()
		return leftYear == rightYear && leftWeek == rightWeek
	case "monthly":
		return left.Year() == right.Year() && left.Month() == right.Month()
	case "annually":
		return left.Year() == right.Year()
	default:
		return false
	}
}
