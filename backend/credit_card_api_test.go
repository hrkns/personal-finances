package backend

import (
	"encoding/json"
	"net/http"
	"testing"
)

func TestCreditCardCRUDFlow(t *testing.T) {
	application := newTestApplication(t)
	router := application.routes()

	seedCreditCardDependencies(t, router)

	createResponse := performRequest(
		router,
		http.MethodPost,
		"/api/credit-cards",
		[]byte(`{"bank_id":1,"person_id":1,"number":" 4111 1111 1111 1111 "}`),
	)
	if createResponse.Code != http.StatusCreated {
		t.Fatalf("expected create to return 201, got %d", createResponse.Code)
	}
	if createResponse.Header().Get("Location") == "" {
		t.Fatal("expected Location header for created credit card")
	}

	var created creditCard
	if err := json.NewDecoder(createResponse.Body).Decode(&created); err != nil {
		t.Fatalf("decode created response: %v", err)
	}
	if created.Number != "4111 1111 1111 1111" {
		t.Fatalf("expected number to be trimmed, got %q", created.Number)
	}
	if created.Name != nil {
		t.Fatalf("expected name to default to null, got %+v", created.Name)
	}
	if len(created.CurrencyIDs) != 0 {
		t.Fatalf("expected new credit card to have no currencies, got %+v", created.CurrencyIDs)
	}

	listResponse := performRequest(router, http.MethodGet, "/api/credit-cards", nil)
	if listResponse.Code != http.StatusOK {
		t.Fatalf("expected list to return 200, got %d", listResponse.Code)
	}

	updateResponse := performRequest(
		router,
		http.MethodPut,
		"/api/credit-cards/1",
		[]byte(`{"bank_id":1,"person_id":1,"number":"9999","name":"  Personal Visa  "}`),
	)
	if updateResponse.Code != http.StatusOK {
		t.Fatalf("expected update to return 200, got %d", updateResponse.Code)
	}

	var updated creditCard
	if err := json.NewDecoder(updateResponse.Body).Decode(&updated); err != nil {
		t.Fatalf("decode updated response: %v", err)
	}
	if updated.Name == nil || *updated.Name != "Personal Visa" {
		t.Fatalf("expected name to be saved, got %+v", updated.Name)
	}

	deleteResponse := performRequest(router, http.MethodDelete, "/api/credit-cards/1", nil)
	if deleteResponse.Code != http.StatusNoContent {
		t.Fatalf("expected delete to return 204, got %d", deleteResponse.Code)
	}

	getAfterDelete := performRequest(router, http.MethodGet, "/api/credit-cards/1", nil)
	if getAfterDelete.Code != http.StatusNotFound {
		t.Fatalf("expected get after delete to return 404, got %d", getAfterDelete.Code)
	}
}

func TestCreditCardUniqueNumberConstraint(t *testing.T) {
	application := newTestApplication(t)
	router := application.routes()

	seedCreditCardDependencies(t, router)

	first := performRequest(router, http.MethodPost, "/api/credit-cards", []byte(`{"bank_id":1,"person_id":1,"number":"1111"}`))
	if first.Code != http.StatusCreated {
		t.Fatalf("expected first create to return 201, got %d", first.Code)
	}

	duplicate := performRequest(router, http.MethodPost, "/api/credit-cards", []byte(`{"bank_id":1,"person_id":1,"number":"1111"}`))
	if duplicate.Code != http.StatusConflict {
		t.Fatalf("expected duplicate create to return 409, got %d", duplicate.Code)
	}
}

func TestCreditCardCurrencyManagement(t *testing.T) {
	application := newTestApplication(t)
	router := application.routes()

	seedCreditCardDependencies(t, router)

	usd := performRequest(router, http.MethodPost, "/api/currencies", []byte(`{"name":"US Dollar","code":"USD"}`))
	if usd.Code != http.StatusCreated {
		t.Fatalf("expected currency seed to return 201, got %d", usd.Code)
	}

	eur := performRequest(router, http.MethodPost, "/api/currencies", []byte(`{"name":"Euro","code":"EUR"}`))
	if eur.Code != http.StatusCreated {
		t.Fatalf("expected second currency seed to return 201, got %d", eur.Code)
	}

	created := performRequest(
		router,
		http.MethodPost,
		"/api/credit-cards",
		[]byte(`{"bank_id":1,"person_id":1,"number":"5000","currency_ids":[1,2,1]}`),
	)
	if created.Code != http.StatusCreated {
		t.Fatalf("expected credit card create to return 201, got %d", created.Code)
	}

	var createdCard creditCard
	if err := json.NewDecoder(created.Body).Decode(&createdCard); err != nil {
		t.Fatalf("decode created credit card: %v", err)
	}
	if len(createdCard.CurrencyIDs) != 2 {
		t.Fatalf("expected two currency ids in create response, got %+v", createdCard.CurrencyIDs)
	}

	updateCurrencies := performRequest(
		router,
		http.MethodPut,
		"/api/credit-cards/1/currencies",
		[]byte(`{"currency_ids":[2]}`),
	)
	if updateCurrencies.Code != http.StatusOK {
		t.Fatalf("expected currencies update to return 200, got %d", updateCurrencies.Code)
	}

	listCurrencies := performRequest(router, http.MethodGet, "/api/credit-cards/1/currencies", nil)
	if listCurrencies.Code != http.StatusOK {
		t.Fatalf("expected list currencies to return 200, got %d", listCurrencies.Code)
	}

	var currencyLinks []creditCardCurrency
	if err := json.NewDecoder(listCurrencies.Body).Decode(&currencyLinks); err != nil {
		t.Fatalf("decode currencies response: %v", err)
	}
	if len(currencyLinks) != 1 {
		t.Fatalf("expected one currency link after dedicated endpoint update, got %+v", currencyLinks)
	}

	fullUpdate := performRequest(
		router,
		http.MethodPut,
		"/api/credit-cards/1",
		[]byte(`{"bank_id":1,"person_id":1,"number":"5001","name":"Card","currency_ids":[1]}`),
	)
	if fullUpdate.Code != http.StatusOK {
		t.Fatalf("expected full update to return 200, got %d", fullUpdate.Code)
	}

	getCard := performRequest(router, http.MethodGet, "/api/credit-cards/1", nil)
	if getCard.Code != http.StatusOK {
		t.Fatalf("expected get credit card to return 200, got %d", getCard.Code)
	}

	var item creditCard
	if err := json.NewDecoder(getCard.Body).Decode(&item); err != nil {
		t.Fatalf("decode credit card response: %v", err)
	}
	if len(item.CurrencyIDs) != 1 {
		t.Fatalf("expected currency_ids on credit card, got %+v", item.CurrencyIDs)
	}
}

func TestCreditCardValidationErrors(t *testing.T) {
	application := newTestApplication(t)
	router := application.routes()

	seedCreditCardDependencies(t, router)

	invalidNumber := performRequest(router, http.MethodPost, "/api/credit-cards", []byte(`{"bank_id":1,"person_id":1,"number":"   "}`))
	if invalidNumber.Code != http.StatusBadRequest {
		t.Fatalf("expected invalid number to return 400, got %d", invalidNumber.Code)
	}

	invalidBank := performRequest(router, http.MethodPost, "/api/credit-cards", []byte(`{"bank_id":999,"person_id":1,"number":"123"}`))
	if invalidBank.Code != http.StatusBadRequest {
		t.Fatalf("expected invalid bank to return 400, got %d", invalidBank.Code)
	}

	invalidPerson := performRequest(router, http.MethodPost, "/api/credit-cards", []byte(`{"bank_id":1,"person_id":999,"number":"123"}`))
	if invalidPerson.Code != http.StatusBadRequest {
		t.Fatalf("expected invalid person to return 400, got %d", invalidPerson.Code)
	}

	invalidCreateCurrencyID := performRequest(
		router,
		http.MethodPost,
		"/api/credit-cards",
		[]byte(`{"bank_id":1,"person_id":1,"number":"124","currency_ids":[0]}`),
	)
	if invalidCreateCurrencyID.Code != http.StatusBadRequest {
		t.Fatalf("expected invalid create currency id to return 400, got %d", invalidCreateCurrencyID.Code)
	}

	invalidID := performRequest(router, http.MethodGet, "/api/credit-cards/not-a-number", nil)
	if invalidID.Code != http.StatusBadRequest {
		t.Fatalf("expected invalid id to return 400, got %d", invalidID.Code)
	}

	created := performRequest(router, http.MethodPost, "/api/credit-cards", []byte(`{"bank_id":1,"person_id":1,"number":"123"}`))
	if created.Code != http.StatusCreated {
		t.Fatalf("expected credit card create to return 201, got %d", created.Code)
	}

	invalidCurrencyLink := performRequest(
		router,
		http.MethodPut,
		"/api/credit-cards/1/currencies",
		[]byte(`{"currency_ids":[999]}`),
	)
	if invalidCurrencyLink.Code != http.StatusBadRequest {
		t.Fatalf("expected invalid currency link to return 400, got %d", invalidCurrencyLink.Code)
	}

	invalidCurrencyID := performRequest(
		router,
		http.MethodPut,
		"/api/credit-cards/1/currencies",
		[]byte(`{"currency_ids":[0]}`),
	)
	if invalidCurrencyID.Code != http.StatusBadRequest {
		t.Fatalf("expected invalid currency id to return 400, got %d", invalidCurrencyID.Code)
	}

	notFoundCurrencyRoute := performRequest(router, http.MethodGet, "/api/credit-cards/999/currencies", nil)
	if notFoundCurrencyRoute.Code != http.StatusNotFound {
		t.Fatalf("expected unknown credit card currencies to return 404, got %d", notFoundCurrencyRoute.Code)
	}
}

func seedCreditCardDependencies(t *testing.T, router http.Handler) {
	t.Helper()

	bank := performRequest(router, http.MethodPost, "/api/banks", []byte(`{"name":"Credit Bank","country":"US"}`))
	if bank.Code != http.StatusCreated {
		t.Fatalf("expected bank seed to return 201, got %d", bank.Code)
	}

	person := performRequest(router, http.MethodPost, "/api/people", []byte(`{"name":"Credit Person"}`))
	if person.Code != http.StatusCreated {
		t.Fatalf("expected person seed to return 201, got %d", person.Code)
	}
}
