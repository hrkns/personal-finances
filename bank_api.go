package main

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
)

const (
	banksPath       = "/api/banks"
	banksPathByID   = "/api/banks/"
	bankPathPattern = "/api/banks/%d"
)

type bank struct {
	ID      int64  `json:"id"`
	Name    string `json:"name"`
	Country string `json:"country"`
}

type bankPayload struct {
	Name    string `json:"name"`
	Country string `json:"country"`
}

func (application app) registerBankRoutes(mux *http.ServeMux) {
	mux.HandleFunc(banksPath, application.banksHandler)
	mux.HandleFunc(banksPathByID, application.bankByIDHandler)
}

func (application app) banksHandler(writer http.ResponseWriter, request *http.Request) {
	switch request.Method {
	case http.MethodGet:
		application.listBanks(writer)
	case http.MethodPost:
		application.createBank(writer, request)
	default:
		methodNotAllowed(writer, http.MethodGet, http.MethodPost)
	}
}

func (application app) bankByIDHandler(writer http.ResponseWriter, request *http.Request) {
	id, err := parseIDFromPath(request.URL.Path, banksPathByID)
	if err != nil {
		writeError(writer, http.StatusBadRequest, "invalid_id", "bank id must be a positive integer")
		return
	}

	switch request.Method {
	case http.MethodGet:
		application.getBank(writer, id)
	case http.MethodPut:
		application.updateBank(writer, request, id)
	case http.MethodDelete:
		application.deleteBank(writer, id)
	default:
		methodNotAllowed(writer, http.MethodGet, http.MethodPut, http.MethodDelete)
	}
}

func (application app) listBanks(writer http.ResponseWriter) {
	rows, err := application.db.Query(`SELECT id, name, country FROM banks ORDER BY id`)
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to load banks")
		return
	}
	defer rows.Close()

	items := make([]bank, 0)
	for rows.Next() {
		var item bank
		if scanErr := rows.Scan(&item.ID, &item.Name, &item.Country); scanErr != nil {
			writeError(writer, http.StatusInternalServerError, "internal_error", "failed to read banks")
			return
		}
		items = append(items, item)
	}

	writeJSON(writer, http.StatusOK, items)
}

func (application app) getBank(writer http.ResponseWriter, id int64) {
	var item bank
	err := application.db.QueryRow(`SELECT id, name, country FROM banks WHERE id = ?`, id).Scan(&item.ID, &item.Name, &item.Country)
	if errors.Is(err, sql.ErrNoRows) {
		writeError(writer, http.StatusNotFound, "not_found", "bank not found")
		return
	}
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to load bank")
		return
	}

	writeJSON(writer, http.StatusOK, item)
}

func (application app) createBank(writer http.ResponseWriter, request *http.Request) {
	payload, validationErr := decodeBankPayload(request)
	if validationErr != nil {
		writeError(writer, http.StatusBadRequest, "invalid_payload", validationErr.Error())
		return
	}

	exists, err := application.countryExists(payload.Country)
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to validate country")
		return
	}
	if !exists {
		writeError(writer, http.StatusBadRequest, "invalid_payload", "country must exist")
		return
	}

	result, err := application.db.Exec(`INSERT INTO banks(name, country) VALUES (?, ?)`, payload.Name, payload.Country)
	if err != nil {
		if isUniqueConstraintError(err) {
			writeError(writer, http.StatusConflict, "duplicate_bank", "name and country combination must be unique")
			return
		}
		if isForeignKeyConstraintError(err) {
			writeError(writer, http.StatusBadRequest, "invalid_payload", "country must exist")
			return
		}
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to create bank")
		return
	}

	id, err := result.LastInsertId()
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to read created bank id")
		return
	}

	created := bank{ID: id, Name: payload.Name, Country: payload.Country}
	writer.Header().Set("Location", fmt.Sprintf(bankPathPattern, id))
	writeJSON(writer, http.StatusCreated, created)
}

func (application app) updateBank(writer http.ResponseWriter, request *http.Request, id int64) {
	payload, validationErr := decodeBankPayload(request)
	if validationErr != nil {
		writeError(writer, http.StatusBadRequest, "invalid_payload", validationErr.Error())
		return
	}

	exists, err := application.countryExists(payload.Country)
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to validate country")
		return
	}
	if !exists {
		writeError(writer, http.StatusBadRequest, "invalid_payload", "country must exist")
		return
	}

	result, err := application.db.Exec(`UPDATE banks SET name = ?, country = ? WHERE id = ?`, payload.Name, payload.Country, id)
	if err != nil {
		if isUniqueConstraintError(err) {
			writeError(writer, http.StatusConflict, "duplicate_bank", "name and country combination must be unique")
			return
		}
		if isForeignKeyConstraintError(err) {
			writeError(writer, http.StatusBadRequest, "invalid_payload", "country must exist")
			return
		}
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to update bank")
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to read update result")
		return
	}
	if rowsAffected == 0 {
		writeError(writer, http.StatusNotFound, "not_found", "bank not found")
		return
	}

	updated := bank{ID: id, Name: payload.Name, Country: payload.Country}
	writeJSON(writer, http.StatusOK, updated)
}

func (application app) deleteBank(writer http.ResponseWriter, id int64) {
	result, err := application.db.Exec(`DELETE FROM banks WHERE id = ?`, id)
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to delete bank")
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to read delete result")
		return
	}
	if rowsAffected == 0 {
		writeError(writer, http.StatusNotFound, "not_found", "bank not found")
		return
	}

	writer.WriteHeader(http.StatusNoContent)
}

func decodeBankPayload(request *http.Request) (bankPayload, error) {
	defer request.Body.Close()

	var payload bankPayload
	if err := json.NewDecoder(request.Body).Decode(&payload); err != nil {
		return bankPayload{}, fmt.Errorf("request body must be valid JSON")
	}

	payload.Name = strings.TrimSpace(payload.Name)
	payload.Country = strings.ToUpper(strings.TrimSpace(payload.Country))

	if payload.Name == "" {
		return bankPayload{}, fmt.Errorf("name is required")
	}
	if payload.Country == "" {
		return bankPayload{}, fmt.Errorf("country is required")
	}

	return payload, nil
}

func (application app) countryExists(code string) (bool, error) {
	var storedCode string
	err := application.db.QueryRow(`SELECT code FROM countries WHERE code = ?`, code).Scan(&storedCode)
	if errors.Is(err, sql.ErrNoRows) {
		return false, nil
	}
	if err != nil {
		return false, err
	}

	return true, nil
}
