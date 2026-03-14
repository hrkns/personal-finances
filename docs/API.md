# REST API Documentation

## API Overview

### Base URL

For local development:

- `http://localhost:8080`

All API endpoints are under:

- `/api/*`

### Content Type

- Requests with body: `Content-Type: application/json`
- Responses: `application/json` (except `204 No Content`)

### Error Response Format

All validation and business errors use this shape:

```json
{
  "error": {
    "code": "string_code",
    "message": "human readable message"
  }
}
```

Common HTTP status usage:

- `200 OK`: successful read/update
- `201 Created`: successful creation
- `204 No Content`: successful delete
- `400 Bad Request`: invalid payload/path id/invalid country
- `404 Not Found`: resource not found
- `405 Method Not Allowed`: wrong HTTP method
- `409 Conflict`: unique constraint violation
- `500 Internal Server Error`: unexpected internal failure

## Health API

### `GET /api/health`

Checks backend availability.

#### Success (`200 OK`)

```json
{
  "status": "ok",
  "message": "backend is up"
}
```

## Index

- [Countries](api/countries.md)
- [Currencies](api/currencies.md)
- [People](api/people.md)
- [Banks](api/banks.md)
- [Bank Accounts](api/bank-accounts.md)
- [Transaction Categories](api/transaction-categories.md)
- [Transactions](api/transactions.md)
- [Credit Cards](api/credit-cards.md)
- [Credit Card Cycles](api/credit-card-cycles.md)
- [Credit Card Cycle Balances](api/credit-card-cycle-balances.md)
- [Credit Card Installments](api/credit-card-installments.md)
- [Credit Card Subscriptions](api/credit-card-subscriptions.md)
- [Expenses](api/expenses.md)
- [Expense Payments](api/expense-payments.md)
