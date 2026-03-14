# Credit Cards API

Credit cards reference an existing bank and person, and enforce globally unique card numbers.

### Credit Card Object

```json
{
  "id": 1,
  "bank_id": 1,
  "person_id": 1,
  "number": "4111 1111 1111 1111",
  "name": "Main Card"
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

### `GET /api/credit-cards`

#### Success (`200 OK`)

```json
[
  {
    "id": 1,
    "bank_id": 1,
    "person_id": 1,
    "number": "4111 1111 1111 1111",
    "name": "Main Card"
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
  "name": "Main Card"
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
    "message": "bank and person must exist"
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
