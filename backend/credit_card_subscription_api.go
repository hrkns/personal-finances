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
	creditCardSubscriptionsPath       = "/api/credit-card-subscriptions"
	creditCardSubscriptionsPathByID   = "/api/credit-card-subscriptions/"
	creditCardSubscriptionPathPattern = "/api/credit-card-subscriptions/%d"
)

type creditCardSubscription struct {
	ID           int64   `json:"id"`
	CreditCardID int64   `json:"credit_card_id"`
	CurrencyID   int64   `json:"currency_id"`
	Concept      string  `json:"concept"`
	Amount       float64 `json:"amount"`
}

type creditCardSubscriptionPayload struct {
	CreditCardID int64   `json:"credit_card_id"`
	CurrencyID   int64   `json:"currency_id"`
	Concept      string  `json:"concept"`
	Amount       float64 `json:"amount"`
}

func (application app) registerCreditCardSubscriptionRoutes(mux *http.ServeMux) {
	mux.HandleFunc(creditCardSubscriptionsPath, application.creditCardSubscriptionsHandler)
	mux.HandleFunc(creditCardSubscriptionsPathByID, application.creditCardSubscriptionByIDHandler)
}

func (application app) creditCardSubscriptionsHandler(writer http.ResponseWriter, request *http.Request) {
	switch request.Method {
	case http.MethodGet:
		application.listCreditCardSubscriptions(writer)
	case http.MethodPost:
		application.createCreditCardSubscription(writer, request)
	default:
		methodNotAllowed(writer, http.MethodGet, http.MethodPost)
	}
}

func (application app) creditCardSubscriptionByIDHandler(writer http.ResponseWriter, request *http.Request) {
	id, err := parseIDFromPath(request.URL.Path, creditCardSubscriptionsPathByID)
	if err != nil {
		writeError(writer, http.StatusBadRequest, "invalid_id", "credit card subscription id must be a positive integer")
		return
	}

	switch request.Method {
	case http.MethodGet:
		application.getCreditCardSubscription(writer, id)
	case http.MethodPut:
		application.updateCreditCardSubscription(writer, request, id)
	case http.MethodDelete:
		application.deleteCreditCardSubscription(writer, id)
	default:
		methodNotAllowed(writer, http.MethodGet, http.MethodPut, http.MethodDelete)
	}
}

func (application app) listCreditCardSubscriptions(writer http.ResponseWriter) {
	rows, err := application.db.Query(
		`SELECT id, credit_card_id, currency_id, concept, amount FROM credit_card_subscriptions ORDER BY id`,
	)
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to load credit card subscriptions")
		return
	}
	defer rows.Close()

	items := make([]creditCardSubscription, 0)
	for rows.Next() {
		item, scanErr := scanCreditCardSubscription(rows)
		if scanErr != nil {
			writeError(writer, http.StatusInternalServerError, "internal_error", "failed to read credit card subscriptions")
			return
		}
		items = append(items, item)
	}

	if err = rows.Err(); err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to read credit card subscriptions")
		return
	}

	writeJSON(writer, http.StatusOK, items)
}

func (application app) getCreditCardSubscription(writer http.ResponseWriter, id int64) {
	item, err := application.fetchCreditCardSubscription(id)
	if errors.Is(err, sql.ErrNoRows) {
		writeError(writer, http.StatusNotFound, "not_found", "credit card subscription not found")
		return
	}
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to load credit card subscription")
		return
	}

	writeJSON(writer, http.StatusOK, item)
}

func (application app) createCreditCardSubscription(writer http.ResponseWriter, request *http.Request) {
	payload, validationErr := decodeCreditCardSubscriptionPayload(request)
	if validationErr != nil {
		writeError(writer, http.StatusBadRequest, "invalid_payload", validationErr.Error())
		return
	}

	result, err := application.db.Exec(
		`INSERT INTO credit_card_subscriptions(credit_card_id, currency_id, concept, amount) VALUES (?, ?, ?, ?)`,
		payload.CreditCardID,
		payload.CurrencyID,
		payload.Concept,
		payload.Amount,
	)
	if err != nil {
		if isUniqueConstraintError(err) {
			writeError(writer, http.StatusConflict, "duplicate_credit_card_subscription", "credit card, currency and concept combination must be unique")
			return
		}
		if isForeignKeyConstraintError(err) {
			writeError(writer, http.StatusBadRequest, "invalid_payload", "credit card and currency must exist")
			return
		}
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to create credit card subscription")
		return
	}

	id, err := result.LastInsertId()
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to read created credit card subscription id")
		return
	}

	created, err := application.fetchCreditCardSubscription(id)
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to load created credit card subscription")
		return
	}

	writer.Header().Set("Location", fmt.Sprintf(creditCardSubscriptionPathPattern, id))
	writeJSON(writer, http.StatusCreated, created)
}

func (application app) updateCreditCardSubscription(writer http.ResponseWriter, request *http.Request, id int64) {
	payload, validationErr := decodeCreditCardSubscriptionPayload(request)
	if validationErr != nil {
		writeError(writer, http.StatusBadRequest, "invalid_payload", validationErr.Error())
		return
	}

	result, err := application.db.Exec(
		`UPDATE credit_card_subscriptions SET credit_card_id = ?, currency_id = ?, concept = ?, amount = ? WHERE id = ?`,
		payload.CreditCardID,
		payload.CurrencyID,
		payload.Concept,
		payload.Amount,
		id,
	)
	if err != nil {
		if isUniqueConstraintError(err) {
			writeError(writer, http.StatusConflict, "duplicate_credit_card_subscription", "credit card, currency and concept combination must be unique")
			return
		}
		if isForeignKeyConstraintError(err) {
			writeError(writer, http.StatusBadRequest, "invalid_payload", "credit card and currency must exist")
			return
		}
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to update credit card subscription")
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to read update result")
		return
	}
	if rowsAffected == 0 {
		writeError(writer, http.StatusNotFound, "not_found", "credit card subscription not found")
		return
	}

	updated, err := application.fetchCreditCardSubscription(id)
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to load updated credit card subscription")
		return
	}

	writeJSON(writer, http.StatusOK, updated)
}

func (application app) deleteCreditCardSubscription(writer http.ResponseWriter, id int64) {
	result, err := application.db.Exec(`DELETE FROM credit_card_subscriptions WHERE id = ?`, id)
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to delete credit card subscription")
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to read delete result")
		return
	}
	if rowsAffected == 0 {
		writeError(writer, http.StatusNotFound, "not_found", "credit card subscription not found")
		return
	}

	writer.WriteHeader(http.StatusNoContent)
}

func decodeCreditCardSubscriptionPayload(request *http.Request) (creditCardSubscriptionPayload, error) {
	defer request.Body.Close()

	var payload creditCardSubscriptionPayload
	if err := json.NewDecoder(request.Body).Decode(&payload); err != nil {
		return creditCardSubscriptionPayload{}, fmt.Errorf("request body must be valid JSON")
	}

	payload.Concept = strings.TrimSpace(payload.Concept)

	if payload.CreditCardID <= 0 {
		return creditCardSubscriptionPayload{}, fmt.Errorf("credit_card_id must be a positive integer")
	}
	if payload.CurrencyID <= 0 {
		return creditCardSubscriptionPayload{}, fmt.Errorf("currency_id must be a positive integer")
	}
	if payload.Concept == "" {
		return creditCardSubscriptionPayload{}, fmt.Errorf("concept is required")
	}
	if payload.Amount <= 0 {
		return creditCardSubscriptionPayload{}, fmt.Errorf("amount must be greater than zero")
	}

	return payload, nil
}

func (application app) fetchCreditCardSubscription(id int64) (creditCardSubscription, error) {
	row := application.db.QueryRow(
		`SELECT id, credit_card_id, currency_id, concept, amount FROM credit_card_subscriptions WHERE id = ?`,
		id,
	)

	item, err := scanCreditCardSubscription(row)
	if err != nil {
		return creditCardSubscription{}, err
	}

	return item, nil
}

func scanCreditCardSubscription(source scanner) (creditCardSubscription, error) {
	var item creditCardSubscription
	if err := source.Scan(&item.ID, &item.CreditCardID, &item.CurrencyID, &item.Concept, &item.Amount); err != nil {
		return creditCardSubscription{}, err
	}

	return item, nil
}
