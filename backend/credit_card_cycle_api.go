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
	creditCardCyclesPath       = "/api/credit-card-cycles"
	creditCardCyclesPathByID   = "/api/credit-card-cycles/"
	creditCardCyclePathPattern = "/api/credit-card-cycles/%d"
)

type creditCardCycle struct {
	ID           int64  `json:"id"`
	CreditCardID int64  `json:"credit_card_id"`
	ClosingDate  string `json:"closing_date"`
	DueDate      string `json:"due_date"`
}

type creditCardCyclePayload struct {
	CreditCardID int64  `json:"credit_card_id"`
	ClosingDate  string `json:"closing_date"`
	DueDate      string `json:"due_date"`
}

func (application app) registerCreditCardCycleRoutes(mux *http.ServeMux) {
	mux.HandleFunc(creditCardCyclesPath, application.creditCardCyclesHandler)
	mux.HandleFunc(creditCardCyclesPathByID, application.creditCardCycleByIDHandler)
}

func (application app) creditCardCyclesHandler(writer http.ResponseWriter, request *http.Request) {
	switch request.Method {
	case http.MethodGet:
		application.listCreditCardCycles(writer)
	case http.MethodPost:
		application.createCreditCardCycle(writer, request)
	default:
		methodNotAllowed(writer, http.MethodGet, http.MethodPost)
	}
}

func (application app) creditCardCycleByIDHandler(writer http.ResponseWriter, request *http.Request) {
	if creditCardCycleBalancesCollectionPathPattern.MatchString(request.URL.Path) ||
		creditCardCycleBalancesByIDPathPattern.MatchString(request.URL.Path) {
		application.creditCardCycleBalancesHandler(writer, request)
		return
	}

	id, err := parseIDFromPath(request.URL.Path, creditCardCyclesPathByID)
	if err != nil {
		writeError(writer, http.StatusBadRequest, "invalid_id", "credit card cycle id must be a positive integer")
		return
	}

	switch request.Method {
	case http.MethodGet:
		application.getCreditCardCycle(writer, id)
	case http.MethodPut:
		application.updateCreditCardCycle(writer, request, id)
	case http.MethodDelete:
		application.deleteCreditCardCycle(writer, id)
	default:
		methodNotAllowed(writer, http.MethodGet, http.MethodPut, http.MethodDelete)
	}
}

func (application app) listCreditCardCycles(writer http.ResponseWriter) {
	rows, err := application.db.Query(`SELECT id, credit_card_id, closing_date, due_date FROM credit_card_cycles ORDER BY id`)
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to load credit card cycles")
		return
	}
	defer rows.Close()

	items := make([]creditCardCycle, 0)
	for rows.Next() {
		item, scanErr := scanCreditCardCycle(rows)
		if scanErr != nil {
			writeError(writer, http.StatusInternalServerError, "internal_error", "failed to read credit card cycles")
			return
		}
		items = append(items, item)
	}

	if err = rows.Err(); err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to read credit card cycles")
		return
	}

	writeJSON(writer, http.StatusOK, items)
}

func (application app) getCreditCardCycle(writer http.ResponseWriter, id int64) {
	item, err := application.fetchCreditCardCycle(id)
	if errors.Is(err, sql.ErrNoRows) {
		writeError(writer, http.StatusNotFound, "not_found", "credit card cycle not found")
		return
	}
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to load credit card cycle")
		return
	}

	writeJSON(writer, http.StatusOK, item)
}

func (application app) createCreditCardCycle(writer http.ResponseWriter, request *http.Request) {
	payload, validationErr := decodeCreditCardCyclePayload(request)
	if validationErr != nil {
		writeError(writer, http.StatusBadRequest, "invalid_payload", validationErr.Error())
		return
	}

	result, err := application.db.Exec(
		`INSERT INTO credit_card_cycles(credit_card_id, closing_date, due_date) VALUES (?, ?, ?)`,
		payload.CreditCardID,
		payload.ClosingDate,
		payload.DueDate,
	)
	if err != nil {
		if isUniqueConstraintError(err) {
			writeError(writer, http.StatusConflict, "duplicate_credit_card_cycle", "credit card cycle already exists")
			return
		}
		if isForeignKeyConstraintError(err) {
			writeError(writer, http.StatusBadRequest, "invalid_payload", "credit card must exist")
			return
		}
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to create credit card cycle")
		return
	}

	id, err := result.LastInsertId()
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to read created credit card cycle id")
		return
	}

	created, err := application.fetchCreditCardCycle(id)
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to load created credit card cycle")
		return
	}

	writer.Header().Set("Location", fmt.Sprintf(creditCardCyclePathPattern, id))
	writeJSON(writer, http.StatusCreated, created)
}

func (application app) updateCreditCardCycle(writer http.ResponseWriter, request *http.Request, id int64) {
	payload, validationErr := decodeCreditCardCyclePayload(request)
	if validationErr != nil {
		writeError(writer, http.StatusBadRequest, "invalid_payload", validationErr.Error())
		return
	}

	result, err := application.db.Exec(
		`UPDATE credit_card_cycles SET credit_card_id = ?, closing_date = ?, due_date = ? WHERE id = ?`,
		payload.CreditCardID,
		payload.ClosingDate,
		payload.DueDate,
		id,
	)
	if err != nil {
		if isUniqueConstraintError(err) {
			writeError(writer, http.StatusConflict, "duplicate_credit_card_cycle", "credit card cycle already exists")
			return
		}
		if isForeignKeyConstraintError(err) {
			writeError(writer, http.StatusBadRequest, "invalid_payload", "credit card must exist")
			return
		}
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to update credit card cycle")
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to read update result")
		return
	}
	if rowsAffected == 0 {
		writeError(writer, http.StatusNotFound, "not_found", "credit card cycle not found")
		return
	}

	updated, err := application.fetchCreditCardCycle(id)
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to load updated credit card cycle")
		return
	}

	writeJSON(writer, http.StatusOK, updated)
}

func (application app) deleteCreditCardCycle(writer http.ResponseWriter, id int64) {
	result, err := application.db.Exec(`DELETE FROM credit_card_cycles WHERE id = ?`, id)
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to delete credit card cycle")
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to read delete result")
		return
	}
	if rowsAffected == 0 {
		writeError(writer, http.StatusNotFound, "not_found", "credit card cycle not found")
		return
	}

	writer.WriteHeader(http.StatusNoContent)
}

func decodeCreditCardCyclePayload(request *http.Request) (creditCardCyclePayload, error) {
	defer request.Body.Close()

	var payload creditCardCyclePayload
	if err := json.NewDecoder(request.Body).Decode(&payload); err != nil {
		return creditCardCyclePayload{}, fmt.Errorf("request body must be valid JSON")
	}

	payload.ClosingDate = strings.TrimSpace(payload.ClosingDate)
	payload.DueDate = strings.TrimSpace(payload.DueDate)

	if payload.CreditCardID <= 0 {
		return creditCardCyclePayload{}, fmt.Errorf("credit_card_id must be a positive integer")
	}
	if !isValidISODate(payload.ClosingDate) {
		return creditCardCyclePayload{}, fmt.Errorf("closing_date must be a valid date in YYYY-MM-DD format")
	}
	if !isValidISODate(payload.DueDate) {
		return creditCardCyclePayload{}, fmt.Errorf("due_date must be a valid date in YYYY-MM-DD format")
	}
	if payload.DueDate < payload.ClosingDate {
		return creditCardCyclePayload{}, fmt.Errorf("due_date must be on or after closing_date")
	}

	return payload, nil
}

func isValidISODate(value string) bool {
	_, err := time.Parse("2006-01-02", value)
	return err == nil
}

func (application app) fetchCreditCardCycle(id int64) (creditCardCycle, error) {
	row := application.db.QueryRow(
		`SELECT id, credit_card_id, closing_date, due_date FROM credit_card_cycles WHERE id = ?`,
		id,
	)

	item, err := scanCreditCardCycle(row)
	if err != nil {
		return creditCardCycle{}, err
	}

	return item, nil
}

func scanCreditCardCycle(source scanner) (creditCardCycle, error) {
	var item creditCardCycle
	err := source.Scan(&item.ID, &item.CreditCardID, &item.ClosingDate, &item.DueDate)
	if err != nil {
		return creditCardCycle{}, err
	}

	return item, nil
}
