# Credit Card Installments API

Credit card installments are standalone resources associated with a credit card.

### Credit Card Installment Object

```json
{
  "id": 1,
  "credit_card_id": 1,
  "currency_id": 1,
  "concept": "Laptop",
  "amount": 1200.5,
  "start_date": "2026-03-01",
  "count": 12
}
```

### Credit Card Installment Payload

```json
{
  "credit_card_id": 1,
  "currency_id": 1,
  "concept": "Laptop",
  "amount": 1200.5,
  "start_date": "2026-03-01",
  "count": 12
}
```

Validation rules:

- `credit_card_id` required, positive integer, must reference an existing credit card
- `currency_id` required, positive integer, must reference an existing currency
- `concept` required, trimmed, non-empty string
- (`credit_card_id`, `currency_id`, `concept`) combination must be unique
- `amount` required number, must be greater than `0`
- `start_date` required, valid date in `YYYY-MM-DD` format
- `count` required integer, must be greater than `0`

### `GET /api/credit-card-installments`

#### Success (`200 OK`)

```json
[
  {
    "id": 1,
    "credit_card_id": 1,
    "currency_id": 1,
    "concept": "Laptop",
    "amount": 1200.5,
    "start_date": "2026-03-01",
    "count": 12
  }
]
```

### `GET /api/credit-card-installments/{id}`

#### Success (`200 OK`)

Body: Credit Card Installment Object.

#### Not Found (`404 Not Found`)

```json
{
  "error": {
    "code": "not_found",
    "message": "credit card installment not found"
  }
}
```

### `POST /api/credit-card-installments`

Request body: Credit Card Installment Payload.

#### Success (`201 Created`)

Headers:

- `Location: /api/credit-card-installments/{id}`

Body: Credit Card Installment Object.

#### Validation Error (`400 Bad Request`)

```json
{
  "error": {
    "code": "invalid_payload",
    "message": "count must be greater than zero"
  }
}
```

#### Conflict (`409 Conflict`)

```json
{
  "error": {
    "code": "duplicate_credit_card_installment",
    "message": "credit card, currency and concept combination must be unique"
  }
}
```

### `PUT /api/credit-card-installments/{id}`

Request body: Credit Card Installment Payload.

#### Success (`200 OK`)

Body: Credit Card Installment Object.

#### Conflict (`409 Conflict`)

```json
{
  "error": {
    "code": "duplicate_credit_card_installment",
    "message": "credit card, currency and concept combination must be unique"
  }
}
```

#### Not Found (`404 Not Found`)

```json
{
  "error": {
    "code": "not_found",
    "message": "credit card installment not found"
  }
}
```

### `DELETE /api/credit-card-installments/{id}`

#### Success (`204 No Content`)

No response body.

#### Not Found (`404 Not Found`)

```json
{
  "error": {
    "code": "not_found",
    "message": "credit card installment not found"
  }
}
```
