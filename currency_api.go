package main

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
	currenciesPath      = "/api/currencies"
	currenciesPathByID  = "/api/currencies/"
	currencyPathPattern = "/api/currencies/%d"
)

type currency struct {
	ID   int64  `json:"id"`
	Name string `json:"name"`
	Code string `json:"code"`
}

type currencyPayload struct {
	Name string `json:"name"`
	Code string `json:"code"`
}

func (application app) registerCurrencyRoutes(mux *http.ServeMux) {
	mux.HandleFunc(currenciesPath, application.currenciesHandler)
	mux.HandleFunc(currenciesPathByID, application.currencyByIDHandler)
}

func (application app) currenciesHandler(writer http.ResponseWriter, request *http.Request) {
	switch request.Method {
	case http.MethodGet:
		application.listCurrencies(writer)
	case http.MethodPost:
		application.createCurrency(writer, request)
	default:
		methodNotAllowed(writer, http.MethodGet, http.MethodPost)
	}
}

func (application app) currencyByIDHandler(writer http.ResponseWriter, request *http.Request) {
	id, err := parseIDFromPath(request.URL.Path, currenciesPathByID)
	if err != nil {
		writeError(writer, http.StatusBadRequest, "invalid_id", "currency id must be a positive integer")
		return
	}

	switch request.Method {
	case http.MethodGet:
		application.getCurrency(writer, id)
	case http.MethodPut:
		application.updateCurrency(writer, request, id)
	case http.MethodDelete:
		application.deleteCurrency(writer, id)
	default:
		methodNotAllowed(writer, http.MethodGet, http.MethodPut, http.MethodDelete)
	}
}

func (application app) listCurrencies(writer http.ResponseWriter) {
	rows, err := application.db.Query(`SELECT id, name, code FROM currencies ORDER BY id`)
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to load currencies")
		return
	}
	defer rows.Close()

	items := make([]currency, 0)
	for rows.Next() {
		var item currency
		if scanErr := rows.Scan(&item.ID, &item.Name, &item.Code); scanErr != nil {
			writeError(writer, http.StatusInternalServerError, "internal_error", "failed to read currencies")
			return
		}
		items = append(items, item)
	}

	writeJSON(writer, http.StatusOK, items)
}

func (application app) getCurrency(writer http.ResponseWriter, id int64) {
	var item currency
	err := application.db.QueryRow(`SELECT id, name, code FROM currencies WHERE id = ?`, id).Scan(&item.ID, &item.Name, &item.Code)
	if errors.Is(err, sql.ErrNoRows) {
		writeError(writer, http.StatusNotFound, "not_found", "currency not found")
		return
	}
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to load currency")
		return
	}

	writeJSON(writer, http.StatusOK, item)
}

func (application app) createCurrency(writer http.ResponseWriter, request *http.Request) {
	payload, validationErr := decodeCurrencyPayload(request)
	if validationErr != nil {
		writeError(writer, http.StatusBadRequest, "invalid_payload", validationErr.Error())
		return
	}

	result, err := application.db.Exec(`INSERT INTO currencies(name, code) VALUES (?, ?)`, payload.Name, payload.Code)
	if err != nil {
		if isUniqueConstraintError(err) {
			writeError(writer, http.StatusConflict, "duplicate_currency", "name and code must be unique")
			return
		}
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to create currency")
		return
	}

	id, err := result.LastInsertId()
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to read created currency id")
		return
	}

	created := currency{ID: id, Name: payload.Name, Code: payload.Code}
	writer.Header().Set("Location", fmt.Sprintf(currencyPathPattern, id))
	writeJSON(writer, http.StatusCreated, created)
}

func (application app) updateCurrency(writer http.ResponseWriter, request *http.Request, id int64) {
	payload, validationErr := decodeCurrencyPayload(request)
	if validationErr != nil {
		writeError(writer, http.StatusBadRequest, "invalid_payload", validationErr.Error())
		return
	}

	result, err := application.db.Exec(`UPDATE currencies SET name = ?, code = ? WHERE id = ?`, payload.Name, payload.Code, id)
	if err != nil {
		if isUniqueConstraintError(err) {
			writeError(writer, http.StatusConflict, "duplicate_currency", "name and code must be unique")
			return
		}
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to update currency")
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to read update result")
		return
	}
	if rowsAffected == 0 {
		writeError(writer, http.StatusNotFound, "not_found", "currency not found")
		return
	}

	updated := currency{ID: id, Name: payload.Name, Code: payload.Code}
	writeJSON(writer, http.StatusOK, updated)
}

func (application app) deleteCurrency(writer http.ResponseWriter, id int64) {
	result, err := application.db.Exec(`DELETE FROM currencies WHERE id = ?`, id)
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to delete currency")
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to read delete result")
		return
	}
	if rowsAffected == 0 {
		writeError(writer, http.StatusNotFound, "not_found", "currency not found")
		return
	}

	writer.WriteHeader(http.StatusNoContent)
}

func decodeCurrencyPayload(request *http.Request) (currencyPayload, error) {
	defer request.Body.Close()

	var payload currencyPayload
	if err := json.NewDecoder(request.Body).Decode(&payload); err != nil {
		return currencyPayload{}, fmt.Errorf("request body must be valid JSON")
	}

	payload.Name = strings.TrimSpace(payload.Name)
	payload.Code = strings.ToUpper(strings.TrimSpace(payload.Code))

	if payload.Name == "" {
		return currencyPayload{}, fmt.Errorf("name is required")
	}
	if payload.Code == "" {
		return currencyPayload{}, fmt.Errorf("code is required")
	}

	return payload, nil
}

func parseIDFromPath(path string, prefix string) (int64, error) {
	trimmed := strings.TrimPrefix(path, prefix)
	if trimmed == path || strings.Contains(trimmed, "/") {
		return 0, errors.New("invalid path")
	}

	id, err := strconv.ParseInt(trimmed, 10, 64)
	if err != nil || id <= 0 {
		return 0, errors.New("invalid id")
	}

	return id, nil
}