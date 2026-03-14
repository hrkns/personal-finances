# Credit Card Subscriptions API

Credit card subscriptions are standalone recurring charges associated with a credit card.

### Credit Card Subscription Object

```json
{
  "id": 1,
  "credit_card_id": 1,
  "currency_id": 1,
  "concept": "Streaming Service",
  "amount": 19.99
}
```

### Credit Card Subscription Payload

```json
{
  "credit_card_id": 1,
  "currency_id": 1,
  "concept": "Streaming Service",
  "amount": 19.99
}
```

Validation rules:

- `credit_card_id` required, positive integer, must reference an existing credit card
- `currency_id` required, positive integer, must reference an existing currency
- `concept` required, trimmed, non-empty string
- `amount` required number, must be greater than `0`
- (`credit_card_id`, `currency_id`, `concept`) combination must be unique

### `GET /api/credit-card-subscriptions`

#### Success (`200 OK`)

```json
[
  {
    "id": 1,
    "credit_card_id": 1,
    "currency_id": 1,
    "concept": "Streaming Service",
    "amount": 19.99
  }
]
```

### `GET /api/credit-card-subscriptions/{id}`

#### Success (`200 OK`)

Body: Credit Card Subscription Object.

#### Not Found (`404 Not Found`)

```json
{
  "error": {
    "code": "not_found",
    "message": "credit card subscription not found"
  }
}
```

### `POST /api/credit-card-subscriptions`

Request body: Credit Card Subscription Payload.

#### Success (`201 Created`)

Headers:

- `Location: /api/credit-card-subscriptions/{id}`

Body: Credit Card Subscription Object.

#### Validation Error (`400 Bad Request`)

```json
{
  "error": {
    "code": "invalid_payload",
    "message": "amount must be greater than zero"
  }
}
```

#### Conflict (`409 Conflict`)

```json
{
  "error": {
    "code": "duplicate_credit_card_subscription",
    "message": "credit card, currency and concept combination must be unique"
  }
}
```

### `PUT /api/credit-card-subscriptions/{id}`

Request body: Credit Card Subscription Payload.

#### Success (`200 OK`)

Body: Credit Card Subscription Object.

#### Not Found (`404 Not Found`)

```json
{
  "error": {
    "code": "not_found",
    "message": "credit card subscription not found"
  }
}
```

#### Conflict (`409 Conflict`)

```json
{
  "error": {
    "code": "duplicate_credit_card_subscription",
    "message": "credit card, currency and concept combination must be unique"
  }
}
```

### `DELETE /api/credit-card-subscriptions/{id}`

#### Success (`204 No Content`)

No response body.

#### Not Found (`404 Not Found`)

```json
{
  "error": {
    "code": "not_found",
    "message": "credit card subscription not found"
  }
}
```
