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
	bankAccountsPath       = "/api/bank-accounts"
	bankAccountsPathByID   = "/api/bank-accounts/"
	bankAccountPathPattern = "/api/bank-accounts/%d"
)

type bankAccount struct {
	ID            int64   `json:"id"`
	BankID        int64   `json:"bank_id"`
	CurrencyID    int64   `json:"currency_id"`
	AccountNumber string  `json:"account_number"`
	Balance       float64 `json:"balance"`
}

type bankAccountPayload struct {
	BankID        int64   `json:"bank_id"`
	CurrencyID    int64   `json:"currency_id"`
	AccountNumber string  `json:"account_number"`
	Balance       float64 `json:"balance"`
}

func (application app) registerBankAccountRoutes(mux *http.ServeMux) {
	mux.HandleFunc(bankAccountsPath, application.bankAccountsHandler)
	mux.HandleFunc(bankAccountsPathByID, application.bankAccountByIDHandler)
}

func (application app) bankAccountsHandler(writer http.ResponseWriter, request *http.Request) {
	switch request.Method {
	case http.MethodGet:
		application.listBankAccounts(writer)
	case http.MethodPost:
		application.createBankAccount(writer, request)
	default:
		methodNotAllowed(writer, http.MethodGet, http.MethodPost)
	}
}

func (application app) bankAccountByIDHandler(writer http.ResponseWriter, request *http.Request) {
	id, err := parseIDFromPath(request.URL.Path, bankAccountsPathByID)
	if err != nil {
		writeError(writer, http.StatusBadRequest, "invalid_id", "bank account id must be a positive integer")
		return
	}

	switch request.Method {
	case http.MethodGet:
		application.getBankAccount(writer, id)
	case http.MethodPut:
		application.updateBankAccount(writer, request, id)
	case http.MethodDelete:
		application.deleteBankAccount(writer, id)
	default:
		methodNotAllowed(writer, http.MethodGet, http.MethodPut, http.MethodDelete)
	}
}

func (application app) listBankAccounts(writer http.ResponseWriter) {
	rows, err := application.db.Query(`SELECT id, bank_id, currency_id, account_number, balance FROM bank_accounts ORDER BY id`)
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to load bank accounts")
		return
	}
	defer rows.Close()

	items := make([]bankAccount, 0)
	for rows.Next() {
		var item bankAccount
		if scanErr := rows.Scan(&item.ID, &item.BankID, &item.CurrencyID, &item.AccountNumber, &item.Balance); scanErr != nil {
			writeError(writer, http.StatusInternalServerError, "internal_error", "failed to read bank accounts")
			return
		}
		items = append(items, item)
	}

	writeJSON(writer, http.StatusOK, items)
}

func (application app) getBankAccount(writer http.ResponseWriter, id int64) {
	var item bankAccount
	err := application.db.QueryRow(`SELECT id, bank_id, currency_id, account_number, balance FROM bank_accounts WHERE id = ?`, id).Scan(
		&item.ID,
		&item.BankID,
		&item.CurrencyID,
		&item.AccountNumber,
		&item.Balance,
	)
	if errors.Is(err, sql.ErrNoRows) {
		writeError(writer, http.StatusNotFound, "not_found", "bank account not found")
		return
	}
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to load bank account")
		return
	}

	writeJSON(writer, http.StatusOK, item)
}

func (application app) createBankAccount(writer http.ResponseWriter, request *http.Request) {
	payload, validationErr := decodeBankAccountPayload(request)
	if validationErr != nil {
		writeError(writer, http.StatusBadRequest, "invalid_payload", validationErr.Error())
		return
	}

	if err := application.validateBankAccountReferences(payload.BankID, payload.CurrencyID); err != nil {
		writeError(writer, http.StatusBadRequest, "invalid_payload", err.Error())
		return
	}

	result, err := application.db.Exec(
		`INSERT INTO bank_accounts(bank_id, currency_id, account_number, balance) VALUES (?, ?, ?, ?)`,
		payload.BankID,
		payload.CurrencyID,
		payload.AccountNumber,
		payload.Balance,
	)
	if err != nil {
		if isUniqueConstraintError(err) {
			writeError(writer, http.StatusConflict, "duplicate_bank_account", "bank, currency and account number combination must be unique")
			return
		}
		if isForeignKeyConstraintError(err) {
			writeError(writer, http.StatusBadRequest, "invalid_payload", "bank and currency must exist")
			return
		}
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to create bank account")
		return
	}

	id, err := result.LastInsertId()
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to read created bank account id")
		return
	}

	created := bankAccount{
		ID:            id,
		BankID:        payload.BankID,
		CurrencyID:    payload.CurrencyID,
		AccountNumber: payload.AccountNumber,
		Balance:       payload.Balance,
	}
	writer.Header().Set("Location", fmt.Sprintf(bankAccountPathPattern, id))
	writeJSON(writer, http.StatusCreated, created)
}

func (application app) updateBankAccount(writer http.ResponseWriter, request *http.Request, id int64) {
	payload, validationErr := decodeBankAccountPayload(request)
	if validationErr != nil {
		writeError(writer, http.StatusBadRequest, "invalid_payload", validationErr.Error())
		return
	}

	if err := application.validateBankAccountReferences(payload.BankID, payload.CurrencyID); err != nil {
		writeError(writer, http.StatusBadRequest, "invalid_payload", err.Error())
		return
	}

	result, err := application.db.Exec(
		`UPDATE bank_accounts SET bank_id = ?, currency_id = ?, account_number = ?, balance = ? WHERE id = ?`,
		payload.BankID,
		payload.CurrencyID,
		payload.AccountNumber,
		payload.Balance,
		id,
	)
	if err != nil {
		if isUniqueConstraintError(err) {
			writeError(writer, http.StatusConflict, "duplicate_bank_account", "bank, currency and account number combination must be unique")
			return
		}
		if isForeignKeyConstraintError(err) {
			writeError(writer, http.StatusBadRequest, "invalid_payload", "bank and currency must exist")
			return
		}
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to update bank account")
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to read update result")
		return
	}
	if rowsAffected == 0 {
		writeError(writer, http.StatusNotFound, "not_found", "bank account not found")
		return
	}

	updated := bankAccount{
		ID:            id,
		BankID:        payload.BankID,
		CurrencyID:    payload.CurrencyID,
		AccountNumber: payload.AccountNumber,
		Balance:       payload.Balance,
	}
	writeJSON(writer, http.StatusOK, updated)
}

func (application app) deleteBankAccount(writer http.ResponseWriter, id int64) {
	result, err := application.db.Exec(`DELETE FROM bank_accounts WHERE id = ?`, id)
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to delete bank account")
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to read delete result")
		return
	}
	if rowsAffected == 0 {
		writeError(writer, http.StatusNotFound, "not_found", "bank account not found")
		return
	}

	writer.WriteHeader(http.StatusNoContent)
}

func decodeBankAccountPayload(request *http.Request) (bankAccountPayload, error) {
	defer request.Body.Close()

	var payload bankAccountPayload
	if err := json.NewDecoder(request.Body).Decode(&payload); err != nil {
		return bankAccountPayload{}, fmt.Errorf("request body must be valid JSON")
	}

	payload.AccountNumber = strings.TrimSpace(payload.AccountNumber)

	if payload.BankID <= 0 {
		return bankAccountPayload{}, fmt.Errorf("bank_id must be a positive integer")
	}
	if payload.CurrencyID <= 0 {
		return bankAccountPayload{}, fmt.Errorf("currency_id must be a positive integer")
	}
	if payload.AccountNumber == "" {
		return bankAccountPayload{}, fmt.Errorf("account_number is required")
	}

	return payload, nil
}

func (application app) validateBankAccountReferences(bankID int64, currencyID int64) error {
	bankExists, err := application.bankExists(bankID)
	if err != nil {
		return fmt.Errorf("failed to validate bank")
	}
	if !bankExists {
		return fmt.Errorf("bank must exist")
	}

	currencyExists, err := application.currencyExists(currencyID)
	if err != nil {
		return fmt.Errorf("failed to validate currency")
	}
	if !currencyExists {
		return fmt.Errorf("currency must exist")
	}

	return nil
}

func (application app) bankExists(id int64) (bool, error) {
	var storedID int64
	err := application.db.QueryRow(`SELECT id FROM banks WHERE id = ?`, id).Scan(&storedID)
	if errors.Is(err, sql.ErrNoRows) {
		return false, nil
	}
	if err != nil {
		return false, err
	}

	return true, nil
}

func (application app) currencyExists(id int64) (bool, error) {
	var storedID int64
	err := application.db.QueryRow(`SELECT id FROM currencies WHERE id = ?`, id).Scan(&storedID)
	if errors.Is(err, sql.ErrNoRows) {
		return false, nil
	}
	if err != nil {
		return false, err
	}

	return true, nil
}
