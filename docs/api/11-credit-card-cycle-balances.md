# Credit Card Cycle Balances API

Credit card cycle balances are child resources under a credit card cycle.

### Credit Card Cycle Balance Object

```json
{
  "id": 1,
  "credit_card_cycle_id": 1,
  "currency_id": 1,
  "balance": 500.25,
  "paid": false
}
```

### Credit Card Cycle Balance Payload

```json
{
  "credit_card_cycle_id": 1,
  "currency_id": 1,
  "balance": 500.25,
  "paid": false
}
```

Validation rules:

- `credit_card_cycle_id` required, positive integer, must match route cycle id
- `currency_id` required, positive integer, must reference an existing currency
- `balance` required number (float)
- `paid` boolean

### `GET /api/credit-card-cycles/{cycle_id}/balances`

#### Success (`200 OK`)

```json
[
  {
    "id": 1,
    "credit_card_cycle_id": 1,
    "currency_id": 1,
    "balance": 500.25,
    "paid": false
  }
]
```

### `GET /api/credit-card-cycles/{cycle_id}/balances/{id}`

#### Success (`200 OK`)

Body: Credit Card Cycle Balance Object.

#### Not Found (`404 Not Found`)

```json
{
  "error": {
    "code": "not_found",
    "message": "credit card cycle balance not found"
  }
}
```

### `POST /api/credit-card-cycles/{cycle_id}/balances`

Request body: Credit Card Cycle Balance Payload.

#### Success (`201 Created`)

Headers:

- `Location: /api/credit-card-cycles/{cycle_id}/balances/{id}`

Body: Credit Card Cycle Balance Object.

#### Validation Error (`400 Bad Request`)

Examples:

```json
{
  "error": {
    "code": "invalid_payload",
    "message": "credit_card_cycle_id must match route id"
  }
}
```

```json
{
  "error": {
    "code": "invalid_payload",
    "message": "credit card cycle and currency must exist"
  }
}
```

### `PUT /api/credit-card-cycles/{cycle_id}/balances/{id}`

Request body: Credit Card Cycle Balance Payload.

#### Success (`200 OK`)

Body: Credit Card Cycle Balance Object.

#### Not Found (`404 Not Found`)

```json
{
  "error": {
    "code": "not_found",
    "message": "credit card cycle balance not found"
  }
}
```

### `DELETE /api/credit-card-cycles/{cycle_id}/balances/{id}`

#### Success (`204 No Content`)

No response body.

#### Not Found (`404 Not Found`)

```json
{
  "error": {
    "code": "not_found",
    "message": "credit card cycle balance not found"
  }
}
```
