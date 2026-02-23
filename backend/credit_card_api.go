package backend

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"
)

const (
	creditCardsPath       = "/api/credit-cards"
	creditCardsPathByID   = "/api/credit-cards/"
	creditCardPathPattern = "/api/credit-cards/%d"
	creditCardCurrenciesPathSuffix = "/currencies"
)

type creditCard struct {
	ID       int64   `json:"id"`
	BankID   int64   `json:"bank_id"`
	PersonID int64   `json:"person_id"`
	Number   string  `json:"number"`
	Name     *string `json:"name"`
	CurrencyIDs []int64 `json:"currency_ids"`
}

type creditCardPayload struct {
	BankID   int64   `json:"bank_id"`
	PersonID int64   `json:"person_id"`
	Number   string  `json:"number"`
	Name     *string `json:"name"`
}

type creditCardCurrency struct {
	ID           int64 `json:"id"`
	CreditCardID int64 `json:"credit_card_id"`
	CurrencyID   int64 `json:"currency_id"`
}

type creditCardCurrenciesPayload struct {
	CurrencyIDs []int64 `json:"currency_ids"`
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
	if strings.HasSuffix(request.URL.Path, creditCardCurrenciesPathSuffix) {
		id, err := parseIDFromPathWithSuffix(request.URL.Path, creditCardsPathByID, creditCardCurrenciesPathSuffix)
		if err != nil {
			writeError(writer, http.StatusBadRequest, "invalid_id", "credit card id must be a positive integer")
			return
		}

		switch request.Method {
		case http.MethodGet:
			application.listCreditCardCurrencies(writer, id)
		case http.MethodPut:
			application.updateCreditCardCurrencies(writer, request, id)
		default:
			methodNotAllowed(writer, http.MethodGet, http.MethodPut)
		}
		return
	}

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

		currencyIDs, currencyErr := application.fetchCreditCardCurrencyIDs(item.ID)
		if currencyErr != nil {
			writeError(writer, http.StatusInternalServerError, "internal_error", "failed to load credit card currencies")
			return
		}
		item.CurrencyIDs = currencyIDs
		items = append(items, item)
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

	if validationErr = application.validateCreditCardReferences(payload.BankID, payload.PersonID); validationErr != nil {
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

	if validationErr = application.validateCreditCardReferences(payload.BankID, payload.PersonID); validationErr != nil {
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

func (application app) listCreditCardCurrencies(writer http.ResponseWriter, creditCardID int64) {
	exists, err := application.creditCardExists(creditCardID)
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to validate credit card")
		return
	}
	if !exists {
		writeError(writer, http.StatusNotFound, "not_found", "credit card not found")
		return
	}

	items, err := application.fetchCreditCardCurrencyLinks(creditCardID)
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to load credit card currencies")
		return
	}

	writeJSON(writer, http.StatusOK, items)
}

func (application app) updateCreditCardCurrencies(writer http.ResponseWriter, request *http.Request, creditCardID int64) {
	exists, err := application.creditCardExists(creditCardID)
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to validate credit card")
		return
	}
	if !exists {
		writeError(writer, http.StatusNotFound, "not_found", "credit card not found")
		return
	}

	payload, validationErr := decodeCreditCardCurrenciesPayload(request)
	if validationErr != nil {
		writeError(writer, http.StatusBadRequest, "invalid_payload", validationErr.Error())
		return
	}

	if validationErr = application.validateCurrencyIDs(payload.CurrencyIDs); validationErr != nil {
		writeError(writer, http.StatusBadRequest, "invalid_payload", validationErr.Error())
		return
	}

	tx, err := application.db.Begin()
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to update credit card currencies")
		return
	}

	if _, err = tx.Exec(`DELETE FROM credit_card_currencies WHERE credit_card_id = ?`, creditCardID); err != nil {
		tx.Rollback()
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to update credit card currencies")
		return
	}

	seenCurrencyIDs := make(map[int64]struct{}, len(payload.CurrencyIDs))
	for _, currencyID := range payload.CurrencyIDs {
		if _, seen := seenCurrencyIDs[currencyID]; seen {
			continue
		}
		seenCurrencyIDs[currencyID] = struct{}{}

		if _, err = tx.Exec(
			`INSERT INTO credit_card_currencies(credit_card_id, currency_id) VALUES (?, ?)`,
			creditCardID,
			currencyID,
		); err != nil {
			tx.Rollback()
			writeError(writer, http.StatusInternalServerError, "internal_error", "failed to update credit card currencies")
			return
		}
	}

	if err = tx.Commit(); err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to update credit card currencies")
		return
	}

	items, err := application.fetchCreditCardCurrencyLinks(creditCardID)
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to load updated credit card currencies")
		return
	}

	writeJSON(writer, http.StatusOK, items)
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

func (application app) validateCreditCardReferences(bankID int64, personID int64) error {
	bankExists, err := application.bankExists(bankID)
	if err != nil {
		return fmt.Errorf("failed to validate bank")
	}
	if !bankExists {
		return fmt.Errorf("bank must exist")
	}

	personExists, err := application.personExists(personID)
	if err != nil {
		return fmt.Errorf("failed to validate person")
	}
	if !personExists {
		return fmt.Errorf("person must exist")
	}

	return nil
}

func (application app) validateCurrencyIDs(currencyIDs []int64) error {
	for _, currencyID := range currencyIDs {
		if currencyID <= 0 {
			return fmt.Errorf("currency_ids must contain only positive integers")
		}

		exists, err := application.currencyExists(currencyID)
		if err != nil {
			return fmt.Errorf("failed to validate currency")
		}
		if !exists {
			return fmt.Errorf("all currencies must exist")
		}
	}

	return nil
}

func (application app) fetchCreditCard(id int64) (creditCard, error) {
	row := application.db.QueryRow(`SELECT id, bank_id, person_id, number, name FROM credit_cards WHERE id = ?`, id)

	item, err := scanCreditCard(row)
	if err != nil {
		return creditCard{}, err
	}

	currencyIDs, err := application.fetchCreditCardCurrencyIDs(id)
	if err != nil {
		return creditCard{}, err
	}
	item.CurrencyIDs = currencyIDs

	return item, nil
}

func (application app) fetchCreditCardCurrencyIDs(creditCardID int64) ([]int64, error) {
	rows, err := application.db.Query(
		`SELECT currency_id FROM credit_card_currencies WHERE credit_card_id = ? ORDER BY currency_id`,
		creditCardID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]int64, 0)
	for rows.Next() {
		var currencyID int64
		if scanErr := rows.Scan(&currencyID); scanErr != nil {
			return nil, scanErr
		}
		items = append(items, currencyID)
	}

	return items, nil
}

func (application app) fetchCreditCardCurrencyLinks(creditCardID int64) ([]creditCardCurrency, error) {
	rows, err := application.db.Query(
		`SELECT id, credit_card_id, currency_id FROM credit_card_currencies WHERE credit_card_id = ? ORDER BY currency_id`,
		creditCardID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]creditCardCurrency, 0)
	for rows.Next() {
		var item creditCardCurrency
		if scanErr := rows.Scan(&item.ID, &item.CreditCardID, &item.CurrencyID); scanErr != nil {
			return nil, scanErr
		}
		items = append(items, item)
	}

	return items, nil
}

func (application app) creditCardExists(id int64) (bool, error) {
	var storedID int64
	err := application.db.QueryRow(`SELECT id FROM credit_cards WHERE id = ?`, id).Scan(&storedID)
	if errors.Is(err, sql.ErrNoRows) {
		return false, nil
	}
	if err != nil {
		return false, err
	}

	return true, nil
}

func parseIDFromPathWithSuffix(path string, prefix string, suffix string) (int64, error) {
	if !strings.HasPrefix(path, prefix) || !strings.HasSuffix(path, suffix) {
		return 0, errors.New("invalid path")
	}

	trimmedPrefix := strings.TrimPrefix(path, prefix)
	trimmed := strings.TrimSuffix(trimmedPrefix, suffix)
	if trimmed == trimmedPrefix || strings.Contains(trimmed, "/") {
		return 0, errors.New("invalid path")
	}

	id, err := strconv.ParseInt(trimmed, 10, 64)
	if err != nil || id <= 0 {
		return 0, errors.New("invalid id")
	}

	return id, nil
}

func decodeCreditCardCurrenciesPayload(request *http.Request) (creditCardCurrenciesPayload, error) {
	defer request.Body.Close()

	var payload creditCardCurrenciesPayload
	if err := json.NewDecoder(request.Body).Decode(&payload); err != nil {
		return creditCardCurrenciesPayload{}, fmt.Errorf("request body must be valid JSON")
	}

	return payload, nil
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
