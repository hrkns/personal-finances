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
	creditCardInstallmentsPath       = "/api/credit-card-installments"
	creditCardInstallmentsPathByID   = "/api/credit-card-installments/"
	creditCardInstallmentPathPattern = "/api/credit-card-installments/%d"
)

type creditCardInstallment struct {
	ID           int64   `json:"id"`
	CreditCardID int64   `json:"credit_card_id"`
	CurrencyID   int64   `json:"currency_id"`
	Concept      string  `json:"concept"`
	Amount       float64 `json:"amount"`
	StartDate    string  `json:"start_date"`
	Count        int64   `json:"count"`
}

type creditCardInstallmentPayload struct {
	CreditCardID int64   `json:"credit_card_id"`
	CurrencyID   int64   `json:"currency_id"`
	Concept      string  `json:"concept"`
	Amount       float64 `json:"amount"`
	StartDate    string  `json:"start_date"`
	Count        int64   `json:"count"`
}

func (application app) registerCreditCardInstallmentRoutes(mux *http.ServeMux) {
	mux.HandleFunc(creditCardInstallmentsPath, application.creditCardInstallmentsHandler)
	mux.HandleFunc(creditCardInstallmentsPathByID, application.creditCardInstallmentByIDHandler)
}

func (application app) creditCardInstallmentsHandler(writer http.ResponseWriter, request *http.Request) {
	switch request.Method {
	case http.MethodGet:
		application.listCreditCardInstallments(writer)
	case http.MethodPost:
		application.createCreditCardInstallment(writer, request)
	default:
		methodNotAllowed(writer, http.MethodGet, http.MethodPost)
	}
}

func (application app) creditCardInstallmentByIDHandler(writer http.ResponseWriter, request *http.Request) {
	id, err := parseIDFromPath(request.URL.Path, creditCardInstallmentsPathByID)
	if err != nil {
		writeError(writer, http.StatusBadRequest, "invalid_id", "credit card installment id must be a positive integer")
		return
	}

	switch request.Method {
	case http.MethodGet:
		application.getCreditCardInstallment(writer, id)
	case http.MethodPut:
		application.updateCreditCardInstallment(writer, request, id)
	case http.MethodDelete:
		application.deleteCreditCardInstallment(writer, id)
	default:
		methodNotAllowed(writer, http.MethodGet, http.MethodPut, http.MethodDelete)
	}
}

func (application app) listCreditCardInstallments(writer http.ResponseWriter) {
	rows, err := application.db.Query(
		`SELECT id, credit_card_id, currency_id, concept, amount, start_date, count FROM credit_card_installments ORDER BY id`,
	)
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to load credit card installments")
		return
	}
	defer rows.Close()

	items := make([]creditCardInstallment, 0)
	for rows.Next() {
		item, scanErr := scanCreditCardInstallment(rows)
		if scanErr != nil {
			writeError(writer, http.StatusInternalServerError, "internal_error", "failed to read credit card installments")
			return
		}
		items = append(items, item)
	}

	if err = rows.Err(); err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to read credit card installments")
		return
	}

	writeJSON(writer, http.StatusOK, items)
}

func (application app) getCreditCardInstallment(writer http.ResponseWriter, id int64) {
	item, err := application.fetchCreditCardInstallment(id)
	if errors.Is(err, sql.ErrNoRows) {
		writeError(writer, http.StatusNotFound, "not_found", "credit card installment not found")
		return
	}
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to load credit card installment")
		return
	}

	writeJSON(writer, http.StatusOK, item)
}

func (application app) createCreditCardInstallment(writer http.ResponseWriter, request *http.Request) {
	payload, validationErr := decodeCreditCardInstallmentPayload(request)
	if validationErr != nil {
		writeError(writer, http.StatusBadRequest, "invalid_payload", validationErr.Error())
		return
	}

	result, err := application.db.Exec(
		`INSERT INTO credit_card_installments(credit_card_id, currency_id, concept, amount, start_date, count) VALUES (?, ?, ?, ?, ?, ?)`,
		payload.CreditCardID,
		payload.CurrencyID,
		payload.Concept,
		payload.Amount,
		payload.StartDate,
		payload.Count,
	)
	if err != nil {
		if isUniqueConstraintError(err) {
			writeError(writer, http.StatusConflict, "duplicate_credit_card_installment", "credit card and concept combination must be unique")
			return
		}
		if isForeignKeyConstraintError(err) {
			writeError(writer, http.StatusBadRequest, "invalid_payload", "credit card and currency must exist")
			return
		}
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to create credit card installment")
		return
	}

	id, err := result.LastInsertId()
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to read created credit card installment id")
		return
	}

	created, err := application.fetchCreditCardInstallment(id)
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to load created credit card installment")
		return
	}

	writer.Header().Set("Location", fmt.Sprintf(creditCardInstallmentPathPattern, id))
	writeJSON(writer, http.StatusCreated, created)
}

func (application app) updateCreditCardInstallment(writer http.ResponseWriter, request *http.Request, id int64) {
	payload, validationErr := decodeCreditCardInstallmentPayload(request)
	if validationErr != nil {
		writeError(writer, http.StatusBadRequest, "invalid_payload", validationErr.Error())
		return
	}

	result, err := application.db.Exec(
		`UPDATE credit_card_installments SET credit_card_id = ?, currency_id = ?, concept = ?, amount = ?, start_date = ?, count = ? WHERE id = ?`,
		payload.CreditCardID,
		payload.CurrencyID,
		payload.Concept,
		payload.Amount,
		payload.StartDate,
		payload.Count,
		id,
	)
	if err != nil {
		if isUniqueConstraintError(err) {
			writeError(writer, http.StatusConflict, "duplicate_credit_card_installment", "credit card and concept combination must be unique")
			return
		}
		if isForeignKeyConstraintError(err) {
			writeError(writer, http.StatusBadRequest, "invalid_payload", "credit card and currency must exist")
			return
		}
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to update credit card installment")
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to read update result")
		return
	}
	if rowsAffected == 0 {
		writeError(writer, http.StatusNotFound, "not_found", "credit card installment not found")
		return
	}

	updated, err := application.fetchCreditCardInstallment(id)
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to load updated credit card installment")
		return
	}

	writeJSON(writer, http.StatusOK, updated)
}

func (application app) deleteCreditCardInstallment(writer http.ResponseWriter, id int64) {
	result, err := application.db.Exec(`DELETE FROM credit_card_installments WHERE id = ?`, id)
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to delete credit card installment")
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to read delete result")
		return
	}
	if rowsAffected == 0 {
		writeError(writer, http.StatusNotFound, "not_found", "credit card installment not found")
		return
	}

	writer.WriteHeader(http.StatusNoContent)
}

func decodeCreditCardInstallmentPayload(request *http.Request) (creditCardInstallmentPayload, error) {
	defer request.Body.Close()

	var payload creditCardInstallmentPayload
	if err := json.NewDecoder(request.Body).Decode(&payload); err != nil {
		return creditCardInstallmentPayload{}, fmt.Errorf("request body must be valid JSON")
	}

	payload.Concept = strings.TrimSpace(payload.Concept)
	payload.StartDate = strings.TrimSpace(payload.StartDate)

	if payload.CreditCardID <= 0 {
		return creditCardInstallmentPayload{}, fmt.Errorf("credit_card_id must be a positive integer")
	}
	if payload.CurrencyID <= 0 {
		return creditCardInstallmentPayload{}, fmt.Errorf("currency_id must be a positive integer")
	}
	if payload.Concept == "" {
		return creditCardInstallmentPayload{}, fmt.Errorf("concept is required")
	}
	if payload.Amount <= 0 {
		return creditCardInstallmentPayload{}, fmt.Errorf("amount must be greater than zero")
	}
	if !isValidISODate(payload.StartDate) {
		return creditCardInstallmentPayload{}, fmt.Errorf("start_date must be a valid date in YYYY-MM-DD format")
	}
	if payload.Count <= 0 {
		return creditCardInstallmentPayload{}, fmt.Errorf("count must be greater than zero")
	}

	return payload, nil
}

func (application app) fetchCreditCardInstallment(id int64) (creditCardInstallment, error) {
	row := application.db.QueryRow(
		`SELECT id, credit_card_id, currency_id, concept, amount, start_date, count FROM credit_card_installments WHERE id = ?`,
		id,
	)

	item, err := scanCreditCardInstallment(row)
	if err != nil {
		return creditCardInstallment{}, err
	}

	return item, nil
}

func scanCreditCardInstallment(source scanner) (creditCardInstallment, error) {
	var item creditCardInstallment
	if err := source.Scan(&item.ID, &item.CreditCardID, &item.CurrencyID, &item.Concept, &item.Amount, &item.StartDate, &item.Count); err != nil {
		return creditCardInstallment{}, err
	}

	return item, nil
}
