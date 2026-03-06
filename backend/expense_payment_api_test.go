package backend

import (
	"encoding/json"
	"net/http"
	"testing"
)

func TestExpensePaymentCRUDFlow(t *testing.T) {
	application := newTestApplication(t)
	router := application.routes()

	seedExpensePaymentDependencies(t, router)

	createResponse := performRequest(
		router,
		http.MethodPost,
		"/api/expense-payments",
		[]byte(`{"expense_id":1,"amount":80.25,"currency_id":1,"date":"2026-03-15"}`),
	)
	if createResponse.Code != http.StatusCreated {
		t.Fatalf("expected create to return 201, got %d", createResponse.Code)
	}
	if createResponse.Header().Get("Location") == "" {
		t.Fatal("expected Location header for created expense payment")
	}

	var created expensePayment
	if err := json.NewDecoder(createResponse.Body).Decode(&created); err != nil {
		t.Fatalf("decode created response: %v", err)
	}
	if created.ExpenseID != 1 || created.CurrencyID != 1 || created.Amount != 80.25 || created.Date != "2026-03-15" {
		t.Fatalf("unexpected created expense payment: %+v", created)
	}

	listResponse := performRequest(router, http.MethodGet, "/api/expense-payments", nil)
	if listResponse.Code != http.StatusOK {
		t.Fatalf("expected list to return 200, got %d", listResponse.Code)
	}

	getResponse := performRequest(router, http.MethodGet, "/api/expense-payments/1", nil)
	if getResponse.Code != http.StatusOK {
		t.Fatalf("expected get to return 200, got %d", getResponse.Code)
	}

	updateResponse := performRequest(
		router,
		http.MethodPut,
		"/api/expense-payments/1",
		[]byte(`{"expense_id":1,"amount":100,"currency_id":1,"date":"2026-03-22"}`),
	)
	if updateResponse.Code != http.StatusOK {
		t.Fatalf("expected update to return 200, got %d", updateResponse.Code)
	}

	var updated expensePayment
	if err := json.NewDecoder(updateResponse.Body).Decode(&updated); err != nil {
		t.Fatalf("decode updated response: %v", err)
	}
	if updated.Amount != 100 || updated.Date != "2026-03-22" {
		t.Fatalf("unexpected updated expense payment: %+v", updated)
	}

	deleteResponse := performRequest(router, http.MethodDelete, "/api/expense-payments/1", nil)
	if deleteResponse.Code != http.StatusNoContent {
		t.Fatalf("expected delete to return 204, got %d", deleteResponse.Code)
	}

	getAfterDelete := performRequest(router, http.MethodGet, "/api/expense-payments/1", nil)
	if getAfterDelete.Code != http.StatusNotFound {
		t.Fatalf("expected get after delete to return 404, got %d", getAfterDelete.Code)
	}
}

func TestExpensePaymentValidationErrors(t *testing.T) {
	application := newTestApplication(t)
	router := application.routes()

	seedExpensePaymentDependencies(t, router)

	invalidExpenseID := performRequest(
		router,
		http.MethodPost,
		"/api/expense-payments",
		[]byte(`{"expense_id":0,"amount":10,"currency_id":1,"date":"2026-01-01"}`),
	)
	if invalidExpenseID.Code != http.StatusBadRequest {
		t.Fatalf("expected invalid expense_id to return 400, got %d", invalidExpenseID.Code)
	}

	invalidAmount := performRequest(
		router,
		http.MethodPost,
		"/api/expense-payments",
		[]byte(`{"expense_id":1,"amount":0,"currency_id":1,"date":"2026-01-01"}`),
	)
	if invalidAmount.Code != http.StatusBadRequest {
		t.Fatalf("expected invalid amount to return 400, got %d", invalidAmount.Code)
	}

	invalidCurrencyID := performRequest(
		router,
		http.MethodPost,
		"/api/expense-payments",
		[]byte(`{"expense_id":1,"amount":10,"currency_id":0,"date":"2026-01-01"}`),
	)
	if invalidCurrencyID.Code != http.StatusBadRequest {
		t.Fatalf("expected invalid currency_id to return 400, got %d", invalidCurrencyID.Code)
	}

	invalidDate := performRequest(
		router,
		http.MethodPost,
		"/api/expense-payments",
		[]byte(`{"expense_id":1,"amount":10,"currency_id":1,"date":"2026-13-01"}`),
	)
	if invalidDate.Code != http.StatusBadRequest {
		t.Fatalf("expected invalid date to return 400, got %d", invalidDate.Code)
	}

	missingForeignKeys := performRequest(
		router,
		http.MethodPost,
		"/api/expense-payments",
		[]byte(`{"expense_id":999,"amount":10,"currency_id":999,"date":"2026-01-01"}`),
	)
	if missingForeignKeys.Code != http.StatusBadRequest {
		t.Fatalf("expected missing foreign keys to return 400, got %d", missingForeignKeys.Code)
	}

	invalidID := performRequest(router, http.MethodGet, "/api/expense-payments/not-a-number", nil)
	if invalidID.Code != http.StatusBadRequest {
		t.Fatalf("expected invalid id path to return 400, got %d", invalidID.Code)
	}
}

func TestExpensePaymentPeriodValidation(t *testing.T) {
	application := newTestApplication(t)
	router := application.routes()

	seedExpensePaymentDependencies(t, router)

	monthlyPayment := performRequest(
		router,
		http.MethodPost,
		"/api/expense-payments",
		[]byte(`{"expense_id":1,"amount":80,"currency_id":1,"date":"2026-03-15"}`),
	)
	if monthlyPayment.Code != http.StatusCreated {
		t.Fatalf("expected first monthly payment to return 201, got %d", monthlyPayment.Code)
	}

	monthlyDuplicate := performRequest(
		router,
		http.MethodPost,
		"/api/expense-payments",
		[]byte(`{"expense_id":1,"amount":90,"currency_id":1,"date":"2026-03-20"}`),
	)
	if monthlyDuplicate.Code != http.StatusConflict {
		t.Fatalf("expected duplicate monthly payment to return 409, got %d", monthlyDuplicate.Code)
	}

	missingResourceUpdate := performRequest(
		router,
		http.MethodPut,
		"/api/expense-payments/999",
		[]byte(`{"expense_id":1,"amount":95,"currency_id":1,"date":"2026-03-25"}`),
	)
	if missingResourceUpdate.Code != http.StatusNotFound {
		t.Fatalf("expected update of non-existent expense payment to return 404, got %d", missingResourceUpdate.Code)
	}

	nextMonth := performRequest(
		router,
		http.MethodPost,
		"/api/expense-payments",
		[]byte(`{"expense_id":1,"amount":90,"currency_id":1,"date":"2026-04-01"}`),
	)
	if nextMonth.Code != http.StatusCreated {
		t.Fatalf("expected monthly payment in different month to return 201, got %d", nextMonth.Code)
	}

	dailyExpense := performRequest(router, http.MethodPost, "/api/expenses", []byte(`{"name":"Coffee","frequency":"daily"}`))
	if dailyExpense.Code != http.StatusCreated {
		t.Fatalf("expected daily expense create to return 201, got %d", dailyExpense.Code)
	}

	dailyPayment := performRequest(
		router,
		http.MethodPost,
		"/api/expense-payments",
		[]byte(`{"expense_id":2,"amount":5,"currency_id":1,"date":"2026-03-15"}`),
	)
	if dailyPayment.Code != http.StatusCreated {
		t.Fatalf("expected first daily payment to return 201, got %d", dailyPayment.Code)
	}

	dailyDuplicate := performRequest(
		router,
		http.MethodPost,
		"/api/expense-payments",
		[]byte(`{"expense_id":2,"amount":5,"currency_id":1,"date":"2026-03-15"}`),
	)
	if dailyDuplicate.Code != http.StatusConflict {
		t.Fatalf("expected duplicate daily payment to return 409, got %d", dailyDuplicate.Code)
	}

	dailyNextDay := performRequest(
		router,
		http.MethodPost,
		"/api/expense-payments",
		[]byte(`{"expense_id":2,"amount":5,"currency_id":1,"date":"2026-03-16"}`),
	)
	if dailyNextDay.Code != http.StatusCreated {
		t.Fatalf("expected daily payment in different day to return 201, got %d", dailyNextDay.Code)
	}

	weeklyExpense := performRequest(router, http.MethodPost, "/api/expenses", []byte(`{"name":"Fuel","frequency":"weekly"}`))
	if weeklyExpense.Code != http.StatusCreated {
		t.Fatalf("expected weekly expense create to return 201, got %d", weeklyExpense.Code)
	}

	weeklyPayment := performRequest(
		router,
		http.MethodPost,
		"/api/expense-payments",
		[]byte(`{"expense_id":3,"amount":40,"currency_id":1,"date":"2026-03-16"}`),
	)
	if weeklyPayment.Code != http.StatusCreated {
		t.Fatalf("expected first weekly payment to return 201, got %d", weeklyPayment.Code)
	}

	weeklyDuplicate := performRequest(
		router,
		http.MethodPost,
		"/api/expense-payments",
		[]byte(`{"expense_id":3,"amount":42,"currency_id":1,"date":"2026-03-18"}`),
	)
	if weeklyDuplicate.Code != http.StatusConflict {
		t.Fatalf("expected duplicate weekly payment to return 409, got %d", weeklyDuplicate.Code)
	}

	weeklyNextWeek := performRequest(
		router,
		http.MethodPost,
		"/api/expense-payments",
		[]byte(`{"expense_id":3,"amount":41,"currency_id":1,"date":"2026-03-23"}`),
	)
	if weeklyNextWeek.Code != http.StatusCreated {
		t.Fatalf("expected weekly payment in different week to return 201, got %d", weeklyNextWeek.Code)
	}

	annualExpense := performRequest(router, http.MethodPost, "/api/expenses", []byte(`{"name":"Insurance","frequency":"annually"}`))
	if annualExpense.Code != http.StatusCreated {
		t.Fatalf("expected annual expense create to return 201, got %d", annualExpense.Code)
	}

	annualPayment := performRequest(
		router,
		http.MethodPost,
		"/api/expense-payments",
		[]byte(`{"expense_id":4,"amount":500,"currency_id":1,"date":"2026-01-15"}`),
	)
	if annualPayment.Code != http.StatusCreated {
		t.Fatalf("expected first annual payment to return 201, got %d", annualPayment.Code)
	}

	annualDuplicate := performRequest(
		router,
		http.MethodPost,
		"/api/expense-payments",
		[]byte(`{"expense_id":4,"amount":510,"currency_id":1,"date":"2026-11-15"}`),
	)
	if annualDuplicate.Code != http.StatusConflict {
		t.Fatalf("expected duplicate annual payment to return 409, got %d", annualDuplicate.Code)
	}

	annualNextYear := performRequest(
		router,
		http.MethodPost,
		"/api/expense-payments",
		[]byte(`{"expense_id":4,"amount":520,"currency_id":1,"date":"2027-01-15"}`),
	)
	if annualNextYear.Code != http.StatusCreated {
		t.Fatalf("expected annual payment in different year to return 201, got %d", annualNextYear.Code)
	}
}

func seedExpensePaymentDependencies(t *testing.T, router http.Handler) {
	t.Helper()

	expense := performRequest(router, http.MethodPost, "/api/expenses", []byte(`{"name":"Rent","frequency":"monthly"}`))
	if expense.Code != http.StatusCreated {
		t.Fatalf("expected expense seed to return 201, got %d", expense.Code)
	}

	currency := performRequest(router, http.MethodPost, "/api/currencies", []byte(`{"name":"US Dollar","code":"USD"}`))
	if currency.Code != http.StatusCreated {
		t.Fatalf("expected currency seed to return 201, got %d", currency.Code)
	}
}
