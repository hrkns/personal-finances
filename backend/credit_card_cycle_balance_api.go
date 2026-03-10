package backend

import (
	"encoding/json"
	"fmt"
	"net/http"
)

var (
	creditCardCycleBalancesPath     = "/api/credit-card-cycle-balances"
	creditCardCycleBalancesPathByID = "/api/credit-card-cycle-balances/"
)

type creditCardCycleBalance struct {
	ID                int64   `json:"id"`
	CreditCardCycleID int64   `json:"credit_card_cycle_id"`
	CurrencyID        int64   `json:"currency_id"`
	Balance           float64 `json:"balance"`
	Paid              bool    `json:"paid"`
}

type creditCardCycleBalancePayload struct {
	CreditCardCycleID int64   `json:"credit_card_cycle_id"`
	CurrencyID        int64   `json:"currency_id"`
	Balance           float64 `json:"balance"`
	Paid              bool    `json:"paid"`
}

func (application app) registerCreditCardCycleBalanceRoutes(mux *http.ServeMux) {
	mux.HandleFunc(creditCardCycleBalancesPath, application.creditCardCycleBalancesCollectionHandler)
	mux.HandleFunc(creditCardCycleBalancesPathByID, application.creditCardCycleBalancesByIDHandler)
}

func (application app) creditCardCycleBalancesCollectionHandler(writer http.ResponseWriter, request *http.Request) {
	switch request.Method {
	case http.MethodGet:
		application.listAllCreditCardCycleBalances(writer)
	case http.MethodPost:
		application.createCreditCardCycleBalance(writer, request)
	default:
		methodNotAllowed(writer, http.MethodGet, http.MethodPost)
	}
}

func (application app) creditCardCycleBalancesByIDHandler(writer http.ResponseWriter, request *http.Request) {
	balanceID, err := parseIDFromPath(request.URL.Path, creditCardCycleBalancesPathByID)
	if err != nil {
		writeError(writer, http.StatusBadRequest, "invalid_id", "credit card cycle balance id must be a positive integer")
		return
	}

	switch request.Method {
	case http.MethodPut:
		application.updateCreditCardCycleBalance(writer, request, balanceID)
	case http.MethodDelete:
		application.deleteCreditCardCycleBalance(writer, balanceID)
	default:
		methodNotAllowed(writer, http.MethodPut, http.MethodDelete)
	}
}

func (application app) listAllCreditCardCycleBalances(writer http.ResponseWriter) {
	rows, err := application.db.Query(
		`SELECT id, credit_card_cycle_id, currency_id, balance, paid FROM credit_card_cycle_balances ORDER BY id`,
	)
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to load credit card cycle balances")
		return
	}
	defer rows.Close()

	items := make([]creditCardCycleBalance, 0)
	for rows.Next() {
		item, scanErr := scanCreditCardCycleBalance(rows)
		if scanErr != nil {
			writeError(writer, http.StatusInternalServerError, "internal_error", "failed to read credit card cycle balances")
			return
		}
		items = append(items, item)
	}

	if err = rows.Err(); err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to read credit card cycle balances")
		return
	}

	writeJSON(writer, http.StatusOK, items)
}

func (application app) createCreditCardCycleBalance(writer http.ResponseWriter, request *http.Request) {
	payload, validationErr := decodeCreditCardCycleBalancePayload(request)
	if validationErr != nil {
		writeError(writer, http.StatusBadRequest, "invalid_payload", validationErr.Error())
		return
	}

	result, err := application.db.Exec(
		`INSERT INTO credit_card_cycle_balances(credit_card_cycle_id, currency_id, balance, paid) VALUES (?, ?, ?, ?)`,
		payload.CreditCardCycleID,
		payload.CurrencyID,
		payload.Balance,
		payload.Paid,
	)
	if err != nil {
		if isUniqueConstraintError(err) {
			writeError(writer, http.StatusConflict, "duplicate_credit_card_cycle_balance", "credit card cycle and currency combination must be unique")
			return
		}
		if isForeignKeyConstraintError(err) {
			writeError(writer, http.StatusBadRequest, "invalid_payload", "credit card cycle and currency must exist")
			return
		}
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to create credit card cycle balance")
		return
	}

	id, err := result.LastInsertId()
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to read created credit card cycle balance id")
		return
	}

	created, err := application.fetchCreditCardCycleBalance(id)
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to load created credit card cycle balance")
		return
	}

	writer.Header().Set("Location", fmt.Sprintf("/api/credit-card-cycle-balances/%d", id))
	writeJSON(writer, http.StatusCreated, created)
}

func (application app) updateCreditCardCycleBalance(writer http.ResponseWriter, request *http.Request, balanceID int64) {
	payload, validationErr := decodeCreditCardCycleBalancePayload(request)
	if validationErr != nil {
		writeError(writer, http.StatusBadRequest, "invalid_payload", validationErr.Error())
		return
	}

	result, err := application.db.Exec(
		`UPDATE credit_card_cycle_balances SET credit_card_cycle_id = ?, currency_id = ?, balance = ?, paid = ? WHERE id = ?`,
		payload.CreditCardCycleID,
		payload.CurrencyID,
		payload.Balance,
		payload.Paid,
		balanceID,
	)
	if err != nil {
		if isUniqueConstraintError(err) {
			writeError(writer, http.StatusConflict, "duplicate_credit_card_cycle_balance", "credit card cycle and currency combination must be unique")
			return
		}
		if isForeignKeyConstraintError(err) {
			writeError(writer, http.StatusBadRequest, "invalid_payload", "credit card cycle and currency must exist")
			return
		}
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to update credit card cycle balance")
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to read update result")
		return
	}
	if rowsAffected == 0 {
		writeError(writer, http.StatusNotFound, "not_found", "credit card cycle balance not found")
		return
	}

	updated, err := application.fetchCreditCardCycleBalance(balanceID)
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to load updated credit card cycle balance")
		return
	}

	writeJSON(writer, http.StatusOK, updated)
}

func (application app) deleteCreditCardCycleBalance(writer http.ResponseWriter, balanceID int64) {
	result, err := application.db.Exec(`DELETE FROM credit_card_cycle_balances WHERE id = ?`, balanceID)
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to delete credit card cycle balance")
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to read delete result")
		return
	}
	if rowsAffected == 0 {
		writeError(writer, http.StatusNotFound, "not_found", "credit card cycle balance not found")
		return
	}

	writer.WriteHeader(http.StatusNoContent)
}

func decodeCreditCardCycleBalancePayload(request *http.Request) (creditCardCycleBalancePayload, error) {
	defer request.Body.Close()

	var payload creditCardCycleBalancePayload
	if err := json.NewDecoder(request.Body).Decode(&payload); err != nil {
		return creditCardCycleBalancePayload{}, fmt.Errorf("request body must be valid JSON")
	}

	if payload.CreditCardCycleID <= 0 {
		return creditCardCycleBalancePayload{}, fmt.Errorf("credit_card_cycle_id must be a positive integer")
	}
	if payload.CurrencyID <= 0 {
		return creditCardCycleBalancePayload{}, fmt.Errorf("currency_id must be a positive integer")
	}

	return payload, nil
}

func (application app) fetchCreditCardCycleBalance(balanceID int64) (creditCardCycleBalance, error) {
	row := application.db.QueryRow(
		`SELECT id, credit_card_cycle_id, currency_id, balance, paid FROM credit_card_cycle_balances WHERE id = ?`,
		balanceID,
	)

	item, err := scanCreditCardCycleBalance(row)
	if err != nil {
		return creditCardCycleBalance{}, err
	}

	return item, nil
}

func scanCreditCardCycleBalance(source scanner) (creditCardCycleBalance, error) {
	var item creditCardCycleBalance
	var paidValue any
	if err := source.Scan(&item.ID, &item.CreditCardCycleID, &item.CurrencyID, &item.Balance, &paidValue); err != nil {
		return creditCardCycleBalance{}, err
	}

	switch value := paidValue.(type) {
	case bool:
		item.Paid = value
	case int64:
		item.Paid = value != 0
	default:
		item.Paid = false
	}

	return item, nil
}

