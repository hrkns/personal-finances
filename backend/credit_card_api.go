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
	creditCardsPath       = "/api/credit-cards"
	creditCardsPathByID   = "/api/credit-cards/"
	creditCardPathPattern = "/api/credit-cards/%d"
)

type creditCard struct {
	ID       int64   `json:"id"`
	BankID   int64   `json:"bank_id"`
	PersonID int64   `json:"person_id"`
	Number   string  `json:"number"`
	Name     *string `json:"name"`
}

type creditCardPayload struct {
	BankID   int64   `json:"bank_id"`
	PersonID int64   `json:"person_id"`
	Number   string  `json:"number"`
	Name     *string `json:"name"`
}

func (application app) registerCreditCardRoutes(mux *http.ServeMux) {
	mux.HandleFunc(creditCardsPath, application.creditCardsHandler)
	mux.HandleFunc(creditCardsPathByID, application.creditCardByIDHandler)
}

func (application app) creditCardsHandler(writer http.ResponseWriter, request *http.Request) {
	switch request.Method {
	case http.MethodGet:
		application.listCreditCards(writer)
	case http.MethodPost:
		application.createCreditCard(writer, request)
	default:
		methodNotAllowed(writer, http.MethodGet, http.MethodPost)
	}
}

func (application app) creditCardByIDHandler(writer http.ResponseWriter, request *http.Request) {
	id, err := parseIDFromPath(request.URL.Path, creditCardsPathByID)
	if err != nil {
		writeError(writer, http.StatusBadRequest, "invalid_id", "credit card id must be a positive integer")
		return
	}

	switch request.Method {
	case http.MethodGet:
		application.getCreditCard(writer, id)
	case http.MethodPut:
		application.updateCreditCard(writer, request, id)
	case http.MethodDelete:
		application.deleteCreditCard(writer, id)
	default:
		methodNotAllowed(writer, http.MethodGet, http.MethodPut, http.MethodDelete)
	}
}

func (application app) listCreditCards(writer http.ResponseWriter) {
	rows, err := application.db.Query(`SELECT id, bank_id, person_id, number, name FROM credit_cards ORDER BY id`)
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to load credit cards")
		return
	}
	defer rows.Close()

	items := make([]creditCard, 0)
	for rows.Next() {
		item, scanErr := scanCreditCard(rows)
		if scanErr != nil {
			writeError(writer, http.StatusInternalServerError, "internal_error", "failed to read credit cards")
			return
		}
		items = append(items, item)
	}

	if err = rows.Err(); err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to read credit cards")
		return
	}

	writeJSON(writer, http.StatusOK, items)
}

func (application app) getCreditCard(writer http.ResponseWriter, id int64) {
	item, err := application.fetchCreditCard(id)
	if errors.Is(err, sql.ErrNoRows) {
		writeError(writer, http.StatusNotFound, "not_found", "credit card not found")
		return
	}
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to load credit card")
		return
	}

	writeJSON(writer, http.StatusOK, item)
}

func (application app) createCreditCard(writer http.ResponseWriter, request *http.Request) {
	payload, validationErr := decodeCreditCardPayload(request)
	if validationErr != nil {
		writeError(writer, http.StatusBadRequest, "invalid_payload", validationErr.Error())
		return
	}

	result, err := application.db.Exec(
		`INSERT INTO credit_cards(bank_id, person_id, number, name) VALUES (?, ?, ?, ?)`,
		payload.BankID,
		payload.PersonID,
		payload.Number,
		payload.Name,
	)
	if err != nil {
		if isUniqueConstraintError(err) {
			writeError(writer, http.StatusConflict, "duplicate_credit_card", "credit card number must be unique")
			return
		}
		if isForeignKeyConstraintError(err) {
			writeError(writer, http.StatusBadRequest, "invalid_payload", "bank and person must exist")
			return
		}
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to create credit card")
		return
	}

	id, err := result.LastInsertId()
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to read created credit card id")
		return
	}

	created, err := application.fetchCreditCard(id)
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to load created credit card")
		return
	}

	writer.Header().Set("Location", fmt.Sprintf(creditCardPathPattern, id))
	writeJSON(writer, http.StatusCreated, created)
}

func (application app) updateCreditCard(writer http.ResponseWriter, request *http.Request, id int64) {
	payload, validationErr := decodeCreditCardPayload(request)
	if validationErr != nil {
		writeError(writer, http.StatusBadRequest, "invalid_payload", validationErr.Error())
		return
	}

	result, err := application.db.Exec(
		`UPDATE credit_cards SET bank_id = ?, person_id = ?, number = ?, name = ? WHERE id = ?`,
		payload.BankID,
		payload.PersonID,
		payload.Number,
		payload.Name,
		id,
	)
	if err != nil {
		if isUniqueConstraintError(err) {
			writeError(writer, http.StatusConflict, "duplicate_credit_card", "credit card number must be unique")
			return
		}
		if isForeignKeyConstraintError(err) {
			writeError(writer, http.StatusBadRequest, "invalid_payload", "bank and person must exist")
			return
		}
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to update credit card")
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to read update result")
		return
	}
	if rowsAffected == 0 {
		writeError(writer, http.StatusNotFound, "not_found", "credit card not found")
		return
	}

	updated, err := application.fetchCreditCard(id)
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to load updated credit card")
		return
	}

	writeJSON(writer, http.StatusOK, updated)
}

func (application app) deleteCreditCard(writer http.ResponseWriter, id int64) {
	result, err := application.db.Exec(`DELETE FROM credit_cards WHERE id = ?`, id)
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to delete credit card")
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to read delete result")
		return
	}
	if rowsAffected == 0 {
		writeError(writer, http.StatusNotFound, "not_found", "credit card not found")
		return
	}

	writer.WriteHeader(http.StatusNoContent)
}

func decodeCreditCardPayload(request *http.Request) (creditCardPayload, error) {
	defer request.Body.Close()

	var payload creditCardPayload
	if err := json.NewDecoder(request.Body).Decode(&payload); err != nil {
		return creditCardPayload{}, fmt.Errorf("request body must be valid JSON")
	}

	payload.Number = strings.TrimSpace(payload.Number)
	if payload.Number == "" {
		return creditCardPayload{}, fmt.Errorf("number is required")
	}

	if payload.BankID <= 0 {
		return creditCardPayload{}, fmt.Errorf("bank_id must be a positive integer")
	}
	if payload.PersonID <= 0 {
		return creditCardPayload{}, fmt.Errorf("person_id must be a positive integer")
	}

	if payload.Name != nil {
		trimmedName := strings.TrimSpace(*payload.Name)
		if trimmedName == "" {
			payload.Name = nil
		} else {
			payload.Name = &trimmedName
		}
	}

	return payload, nil
}

func (application app) fetchCreditCard(id int64) (creditCard, error) {
	row := application.db.QueryRow(`SELECT id, bank_id, person_id, number, name FROM credit_cards WHERE id = ?`, id)

	item, err := scanCreditCard(row)
	if err != nil {
		return creditCard{}, err
	}

	return item, nil
}

func scanCreditCard(source scanner) (creditCard, error) {
	var item creditCard
	var name sql.NullString

	err := source.Scan(&item.ID, &item.BankID, &item.PersonID, &item.Number, &name)
	if err != nil {
		return creditCard{}, err
	}

	if name.Valid {
		value := name.String
		item.Name = &value
	}

	return item, nil
}
