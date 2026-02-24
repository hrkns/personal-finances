# Credit Card Cycles API

Credit card cycles define statement closing and due dates for an existing credit card.

### Credit Card Cycle Object

```json
{
  "id": 1,
  "credit_card_id": 1,
  "closing_date": "2026-03-20",
  "due_date": "2026-03-30"
}
```

### Credit Card Cycle Payload

```json
{
  "credit_card_id": 1,
  "closing_date": "2026-03-20",
  "due_date": "2026-03-30"
}
```

Validation rules:

- `credit_card_id` required, positive integer, must reference an existing credit card
- `closing_date` required, format `YYYY-MM-DD`
- `due_date` required, format `YYYY-MM-DD`
- `due_date` must be on or after `closing_date`
- (`credit_card_id`, `closing_date`, `due_date`) must be unique

### `GET /api/credit-card-cycles`

#### Success (`200 OK`)

```json
[
  {
    "id": 1,
    "credit_card_id": 1,
    "closing_date": "2026-03-20",
    "due_date": "2026-03-30"
  }
]
```

### `GET /api/credit-card-cycles/{id}`

#### Success (`200 OK`)

Body: Credit Card Cycle Object.

#### Not Found (`404 Not Found`)

```json
{
  "error": {
    "code": "not_found",
    "message": "credit card cycle not found"
  }
}
```

#### Invalid ID (`400 Bad Request`)

```json
{
  "error": {
    "code": "invalid_id",
    "message": "credit card cycle id must be a positive integer"
  }
}
```

### `POST /api/credit-card-cycles`

Request body: Credit Card Cycle Payload.

#### Success (`201 Created`)

Headers:

- `Location: /api/credit-card-cycles/{id}`

Body: Credit Card Cycle Object.

#### Validation Error (`400 Bad Request`)

Examples:

```json
{
  "error": {
    "code": "invalid_payload",
    "message": "credit card must exist"
  }
}
```

```json
{
  "error": {
    "code": "invalid_payload",
    "message": "closing_date must be a valid date in YYYY-MM-DD format"
  }
}
```

```json
{
  "error": {
    "code": "invalid_payload",
    "message": "due_date must be on or after closing_date"
  }
}
```

#### Conflict (`409 Conflict`)

```json
{
  "error": {
    "code": "duplicate_credit_card_cycle",
    "message": "credit card cycle already exists"
  }
}
```

### `PUT /api/credit-card-cycles/{id}`

Request body: Credit Card Cycle Payload.

#### Success (`200 OK`)

Body: Credit Card Cycle Object.

#### Not Found (`404 Not Found`)

```json
{
  "error": {
    "code": "not_found",
    "message": "credit card cycle not found"
  }
}
```

#### Validation Error (`400 Bad Request`)

Same validation messages as `POST /api/credit-card-cycles`.

#### Conflict (`409 Conflict`)

```json
{
  "error": {
    "code": "duplicate_credit_card_cycle",
    "message": "credit card cycle already exists"
  }
}
```

### `DELETE /api/credit-card-cycles/{id}`

#### Success (`204 No Content`)

No response body.

#### Not Found (`404 Not Found`)

```json
{
  "error": {
    "code": "not_found",
    "message": "credit card cycle not found"
  }
}
```
