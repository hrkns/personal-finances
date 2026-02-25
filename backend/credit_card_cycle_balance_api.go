package backend

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"regexp"
	"strconv"
)

var (
	creditCardCycleBalancesCollectionPathPattern = regexp.MustCompile(`^/api/credit-card-cycles/(\d+)/balances$`)
	creditCardCycleBalancesByIDPathPattern       = regexp.MustCompile(`^/api/credit-card-cycles/(\d+)/balances/(\d+)$`)
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

func (application app) creditCardCycleBalancesHandler(writer http.ResponseWriter, request *http.Request) {
	cycleID, balanceID, isCollection, parseErr := parseCreditCardCycleBalancePath(request.URL.Path)
	if parseErr != nil {
		writeError(writer, http.StatusBadRequest, "invalid_id", "credit card cycle id and balance id must be positive integers")
		return
	}

	if isCollection {
		switch request.Method {
		case http.MethodGet:
			application.listCreditCardCycleBalances(writer, cycleID)
		case http.MethodPost:
			application.createCreditCardCycleBalance(writer, request, cycleID)
		default:
			methodNotAllowed(writer, http.MethodGet, http.MethodPost)
		}
		return
	}

	switch request.Method {
	case http.MethodGet:
		application.getCreditCardCycleBalance(writer, cycleID, balanceID)
	case http.MethodPut:
		application.updateCreditCardCycleBalance(writer, request, cycleID, balanceID)
	case http.MethodDelete:
		application.deleteCreditCardCycleBalance(writer, cycleID, balanceID)
	default:
		methodNotAllowed(writer, http.MethodGet, http.MethodPut, http.MethodDelete)
	}
}

func parseCreditCardCycleBalancePath(path string) (int64, int64, bool, error) {
	if matches := creditCardCycleBalancesCollectionPathPattern.FindStringSubmatch(path); matches != nil {
		cycleID, err := parseID(matches[1])
		if err != nil {
			return 0, 0, false, err
		}
		return cycleID, 0, true, nil
	}

	if matches := creditCardCycleBalancesByIDPathPattern.FindStringSubmatch(path); matches != nil {
		cycleID, err := parseID(matches[1])
		if err != nil {
			return 0, 0, false, err
		}
		balanceID, err := parseID(matches[2])
		if err != nil {
			return 0, 0, false, err
		}
		return cycleID, balanceID, false, nil
	}

	return 0, 0, false, fmt.Errorf("invalid path")
}

func parseID(raw string) (int64, error) {
	id, err := strconv.ParseInt(raw, 10, 64)
	if err != nil || id <= 0 {
		return 0, fmt.Errorf("invalid id")
	}
	return id, nil
}

func (application app) listCreditCardCycleBalances(writer http.ResponseWriter, cycleID int64) {
	exists, err := application.creditCardCycleExists(cycleID)
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to validate credit card cycle")
		return
	}
	if !exists {
		writeError(writer, http.StatusNotFound, "not_found", "credit card cycle not found")
		return
	}

	rows, err := application.db.Query(
		`SELECT id, credit_card_cycle_id, currency_id, balance, paid FROM credit_card_cycle_balances WHERE credit_card_cycle_id = ? ORDER BY id`,
		cycleID,
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

func (application app) getCreditCardCycleBalance(writer http.ResponseWriter, cycleID int64, balanceID int64) {
	item, err := application.fetchCreditCardCycleBalance(cycleID, balanceID)
	if errors.Is(err, sql.ErrNoRows) {
		writeError(writer, http.StatusNotFound, "not_found", "credit card cycle balance not found")
		return
	}
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to load credit card cycle balance")
		return
	}

	writeJSON(writer, http.StatusOK, item)
}

func (application app) createCreditCardCycleBalance(writer http.ResponseWriter, request *http.Request, cycleID int64) {
	payload, validationErr := decodeCreditCardCycleBalancePayload(request)
	if validationErr != nil {
		writeError(writer, http.StatusBadRequest, "invalid_payload", validationErr.Error())
		return
	}
	if payload.CreditCardCycleID != cycleID {
		writeError(writer, http.StatusBadRequest, "invalid_payload", "credit_card_cycle_id must match route id")
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

	created, err := application.fetchCreditCardCycleBalance(cycleID, id)
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to load created credit card cycle balance")
		return
	}

	writer.Header().Set("Location", fmt.Sprintf("/api/credit-card-cycles/%d/balances/%d", cycleID, id))
	writeJSON(writer, http.StatusCreated, created)
}

func (application app) updateCreditCardCycleBalance(writer http.ResponseWriter, request *http.Request, cycleID int64, balanceID int64) {
	payload, validationErr := decodeCreditCardCycleBalancePayload(request)
	if validationErr != nil {
		writeError(writer, http.StatusBadRequest, "invalid_payload", validationErr.Error())
		return
	}
	if payload.CreditCardCycleID != cycleID {
		writeError(writer, http.StatusBadRequest, "invalid_payload", "credit_card_cycle_id must match route id")
		return
	}

	result, err := application.db.Exec(
		`UPDATE credit_card_cycle_balances SET credit_card_cycle_id = ?, currency_id = ?, balance = ?, paid = ? WHERE id = ? AND credit_card_cycle_id = ?`,
		payload.CreditCardCycleID,
		payload.CurrencyID,
		payload.Balance,
		payload.Paid,
		balanceID,
		cycleID,
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

	updated, err := application.fetchCreditCardCycleBalance(cycleID, balanceID)
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to load updated credit card cycle balance")
		return
	}

	writeJSON(writer, http.StatusOK, updated)
}

func (application app) deleteCreditCardCycleBalance(writer http.ResponseWriter, cycleID int64, balanceID int64) {
	result, err := application.db.Exec(`DELETE FROM credit_card_cycle_balances WHERE id = ? AND credit_card_cycle_id = ?`, balanceID, cycleID)
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

func (application app) fetchCreditCardCycleBalance(cycleID int64, balanceID int64) (creditCardCycleBalance, error) {
	row := application.db.QueryRow(
		`SELECT id, credit_card_cycle_id, currency_id, balance, paid FROM credit_card_cycle_balances WHERE id = ? AND credit_card_cycle_id = ?`,
		balanceID,
		cycleID,
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

func (application app) creditCardCycleExists(id int64) (bool, error) {
	var storedID int64
	err := application.db.QueryRow(`SELECT id FROM credit_card_cycles WHERE id = ?`, id).Scan(&storedID)
	if errors.Is(err, sql.ErrNoRows) {
		return false, nil
	}
	if err != nil {
		return false, err
	}

	return true, nil
}
