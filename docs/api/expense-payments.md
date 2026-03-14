# Expense Payments API

Base path: `/api/expense-payments`

Expense Payment payload attributes:

- `expense_id` (integer, required, must reference an existing expense)
- `amount` (number, required, greater than zero)
- `currency_id` (integer, required, must reference an existing currency)
- `date` (string, required, `YYYY-MM-DD`)

Period uniqueness rule:

- For each expense, only one payment is allowed per period defined by that expense frequency:
  - `daily`: same day
  - `weekly`: same ISO week
  - `monthly`: same month
  - `annually`: same year

## List expense payments

- Method: `GET`
- Path: `/api/expense-payments`
- Success: `200 OK`

Response:

```json
[
  {
    "id": 1,
    "expense_id": 1,
    "amount": 100.5,
    "currency_id": 1,
    "date": "2026-03-15"
  }
]
```

## Create expense payment

- Method: `POST`
- Path: `/api/expense-payments`
- Success: `201 Created`
- Headers: `Location: /api/expense-payments/{id}`

Request body:

```json
{
  "expense_id": 1,
  "amount": 100.5,
  "currency_id": 1,
  "date": "2026-03-15"
}
```

Validation errors (`400 Bad Request`):

- `expense_id must be a positive integer`
- `amount must be greater than zero`
- `currency_id must be a positive integer`
- `date must be a valid date in YYYY-MM-DD format`
- `expense and currency must exist`

Conflict (`409 Conflict`):

- `duplicate_expense_payment_period`: `an expense payment already exists in the same {frequency} period`

## Get expense payment by id

- Method: `GET`
- Path: `/api/expense-payments/{id}`
- Success: `200 OK`

Not found (`404 Not Found`):

- `expense payment not found`

## Update expense payment

- Method: `PUT`
- Path: `/api/expense-payments/{id}`
- Success: `200 OK`

Request body:

```json
{
  "expense_id": 1,
  "amount": 125,
  "currency_id": 1,
  "date": "2026-03-22"
}
```

Validation and period-conflict rules are the same as create.

## Delete expense payment

- Method: `DELETE`
- Path: `/api/expense-payments/{id}`
- Success: `204 No Content`

Not found (`404 Not Found`):

- `expense payment not found`
