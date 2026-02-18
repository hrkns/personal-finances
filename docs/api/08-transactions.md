# Transactions API

Transactions represent money movement entries with an explicit type (`income` or `expense`).

### Transaction Object

```json
{
  "id": 1,
  "transaction_date": "2026-02-18",
  "type": "income",
  "amount": 1200.5,
  "notes": "Salary payment",
  "person_id": 1,
  "bank_account_id": 1,
  "category_id": 1
}
```

### Transaction Payload

```json
{
  "transaction_date": "2026-02-18",
  "type": "income",
  "amount": 1200.5,
  "notes": "Salary payment",
  "person_id": 1,
  "bank_account_id": 1,
  "category_id": 1
}
```

Validation rules:

- `transaction_date` required, date-only format `YYYY-MM-DD`
- `type` required, must be `income` or `expense`
- `amount` required, must be greater than zero
- `person_id` required, positive integer, must reference an existing person
- `bank_account_id` required, positive integer, must reference an existing bank account
- `category_id` required, positive integer, must reference an existing transaction category
- `notes` optional; blank values are normalized to `null`

### `GET /api/transactions`

#### Success (`200 OK`)

```json
[
  {
    "id": 1,
    "transaction_date": "2026-02-18",
    "type": "income",
    "amount": 1200.5,
    "notes": "Salary payment",
    "person_id": 1,
    "bank_account_id": 1,
    "category_id": 1
  }
]
```

### `GET /api/transactions/{id}`

#### Success (`200 OK`)

```json
{
  "id": 1,
  "transaction_date": "2026-02-18",
  "type": "income",
  "amount": 1200.5,
  "notes": "Salary payment",
  "person_id": 1,
  "bank_account_id": 1,
  "category_id": 1
}
```

#### Not Found (`404 Not Found`)

```json
{
  "error": {
    "code": "not_found",
    "message": "transaction not found"
  }
}
```

#### Invalid ID (`400 Bad Request`)

```json
{
  "error": {
    "code": "invalid_id",
    "message": "transaction id must be a positive integer"
  }
}
```

### `POST /api/transactions`

Request body: Transaction Payload.

#### Success (`201 Created`)

Headers:

- `Location: /api/transactions/{id}`

Body: Transaction Object.

#### Validation Error (`400 Bad Request`)

Examples:

```json
{
  "error": {
    "code": "invalid_payload",
    "message": "transaction_date must be a valid date in YYYY-MM-DD format"
  }
}
```

```json
{
  "error": {
    "code": "invalid_payload",
    "message": "type must be either income or expense"
  }
}
```

```json
{
  "error": {
    "code": "invalid_payload",
    "message": "person must exist"
  }
}
```

### `PUT /api/transactions/{id}`

Request body: Transaction Payload.

#### Success (`200 OK`)

Body: Transaction Object.

#### Not Found (`404 Not Found`)

```json
{
  "error": {
    "code": "not_found",
    "message": "transaction not found"
  }
}
```

### `DELETE /api/transactions/{id}`

#### Success (`204 No Content`)

No response body.

#### Not Found (`404 Not Found`)

```json
{
  "error": {
    "code": "not_found",
    "message": "transaction not found"
  }
}
```
