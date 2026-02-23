# Credit Cards API

Credit cards reference an existing bank and person, and enforce globally unique card numbers.

### Credit Card Object

```json
{
  "id": 1,
  "bank_id": 1,
  "person_id": 1,
  "number": "4111 1111 1111 1111",
  "name": "Main Card",
  "currency_ids": [1, 2]
}
```

### Credit Card Payload

```json
{
  "bank_id": 1,
  "person_id": 1,
  "number": "4111 1111 1111 1111",
  "name": "Main Card"
}
```

Normalization rules:

- `number` is trimmed
- `name` is optional; blank values are normalized to `null`

Validation rules:

- `bank_id` required, positive integer, must reference an existing bank
- `person_id` required, positive integer, must reference an existing person
- `number` required, unique
- `name` optional (`null` when omitted/blank)
- `currency_ids` read-only list of currencies associated with the credit card

### `GET /api/credit-cards`

#### Success (`200 OK`)

```json
[
  {
    "id": 1,
    "bank_id": 1,
    "person_id": 1,
    "number": "4111 1111 1111 1111",
    "name": "Main Card",
    "currency_ids": [1, 2]
  }
]
```

### `GET /api/credit-cards/{id}`

#### Success (`200 OK`)

```json
{
  "id": 1,
  "bank_id": 1,
  "person_id": 1,
  "number": "4111 1111 1111 1111",
  "name": "Main Card",
  "currency_ids": [1, 2]
}
```

#### Not Found (`404 Not Found`)

```json
{
  "error": {
    "code": "not_found",
    "message": "credit card not found"
  }
}
```

#### Invalid ID (`400 Bad Request`)

```json
{
  "error": {
    "code": "invalid_id",
    "message": "credit card id must be a positive integer"
  }
}
```

### Credit Card Currency Entity

Credit card currencies are stored in an association entity:

```json
{
  "id": 1,
  "credit_card_id": 1,
  "currency_id": 1
}
```

### `GET /api/credit-cards/{id}/currencies`

Returns all currency links for a specific credit card.

#### Success (`200 OK`)

```json
[
  { "id": 1, "credit_card_id": 1, "currency_id": 1 },
  { "id": 2, "credit_card_id": 1, "currency_id": 2 }
]
```

#### Not Found (`404 Not Found`)

```json
{
  "error": {
    "code": "not_found",
    "message": "credit card not found"
  }
}
```

#### Invalid ID (`400 Bad Request`)

```json
{
  "error": {
    "code": "invalid_id",
    "message": "credit card id must be a positive integer"
  }
}
```

### `PUT /api/credit-cards/{id}/currencies`

Replaces all currencies associated with the credit card.

Request body:

```json
{
  "currency_ids": [1, 2]
}
```

#### Success (`200 OK`)

Returns the stored association rows:

```json
[
  { "id": 1, "credit_card_id": 1, "currency_id": 1 },
  { "id": 2, "credit_card_id": 1, "currency_id": 2 }
]
```

#### Validation Error (`400 Bad Request`)

Examples:

```json
{
  "error": {
    "code": "invalid_payload",
    "message": "currency_ids must contain only positive integers"
  }
}
```

```json
{
  "error": {
    "code": "invalid_payload",
    "message": "all currencies must exist"
  }
}
```

#### Not Found (`404 Not Found`)

```json
{
  "error": {
    "code": "not_found",
    "message": "credit card not found"
  }
}
```

### `POST /api/credit-cards`

Request body: Credit Card Payload.

#### Success (`201 Created`)

Headers:

- `Location: /api/credit-cards/{id}`

Body: Credit Card Object.

#### Validation Error (`400 Bad Request`)

Examples:

```json
{
  "error": {
    "code": "invalid_payload",
    "message": "number is required"
  }
}
```

```json
{
  "error": {
    "code": "invalid_payload",
    "message": "bank must exist"
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

#### Conflict (`409 Conflict`)

```json
{
  "error": {
    "code": "duplicate_credit_card",
    "message": "credit card number must be unique"
  }
}
```

### `PUT /api/credit-cards/{id}`

Request body: Credit Card Payload.

#### Success (`200 OK`)

Body: Credit Card Object.

#### Not Found (`404 Not Found`)

```json
{
  "error": {
    "code": "not_found",
    "message": "credit card not found"
  }
}
```

#### Validation Error (`400 Bad Request`)

Same validation messages as `POST /api/credit-cards`.

#### Conflict (`409 Conflict`)

```json
{
  "error": {
    "code": "duplicate_credit_card",
    "message": "credit card number must be unique"
  }
}
```

### `DELETE /api/credit-cards/{id}`

#### Success (`204 No Content`)

No response body.

#### Not Found (`404 Not Found`)

```json
{
  "error": {
    "code": "not_found",
    "message": "credit card not found"
  }
}
```
