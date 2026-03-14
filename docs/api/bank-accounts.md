# Bank Accounts API

Bank accounts reference existing banks and currencies through foreign keys.

### Bank Account Object

```json
{
  "id": 1,
  "bank_id": 1,
  "currency_id": 1,
  "account_number": "ACC-001",
  "balance": 100.5
}
```

### Bank Account Payload

```json
{
  "bank_id": 1,
  "currency_id": 1,
  "account_number": "ACC-001",
  "balance": 100.5
}
```

Normalization rules:

- `account_number` is trimmed

Validation rules:

- `bank_id` must be a positive integer
- `currency_id` must be a positive integer
- `account_number` required
- (`bank_id`, `currency_id`, `account_number`) combination unique
- `bank_id` must exist in `banks(id)`
- `currency_id` must exist in `currencies(id)`

### `GET /api/bank-accounts`

#### Success (`200 OK`)

```json
[
  {
    "id": 1,
    "bank_id": 1,
    "currency_id": 1,
    "account_number": "ACC-001",
    "balance": 100.5
  }
]
```

### `GET /api/bank-accounts/{id}`

#### Success (`200 OK`)

```json
{
  "id": 1,
  "bank_id": 1,
  "currency_id": 1,
  "account_number": "ACC-001",
  "balance": 100.5
}
```

#### Not Found (`404 Not Found`)

```json
{
  "error": {
    "code": "not_found",
    "message": "bank account not found"
  }
}
```

#### Invalid ID (`400 Bad Request`)

```json
{
  "error": {
    "code": "invalid_id",
    "message": "bank account id must be a positive integer"
  }
}
```

### `POST /api/bank-accounts`

Request body: Bank Account Payload.

#### Success (`201 Created`)

Headers:

- `Location: /api/bank-accounts/{id}`

Body:

```json
{
  "id": 1,
  "bank_id": 1,
  "currency_id": 1,
  "account_number": "ACC-001",
  "balance": 100.5
}
```

#### Validation Error (`400 Bad Request`)

Examples:

```json
{
  "error": {
    "code": "invalid_payload",
    "message": "bank_id must be a positive integer"
  }
}
```

```json
{
  "error": {
    "code": "invalid_payload",
    "message": "currency_id must be a positive integer"
  }
}
```

```json
{
  "error": {
    "code": "invalid_payload",
    "message": "account_number is required"
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
    "message": "currency must exist"
  }
}
```

#### Conflict (`409 Conflict`)

```json
{
  "error": {
    "code": "duplicate_bank_account",
    "message": "bank, currency and account number combination must be unique"
  }
}
```

### `PUT /api/bank-accounts/{id}`

Request body: Bank Account Payload.

#### Success (`200 OK`)

```json
{
  "id": 1,
  "bank_id": 1,
  "currency_id": 1,
  "account_number": "ACC-001-UPDATED",
  "balance": 500
}
```

#### Not Found (`404 Not Found`)

```json
{
  "error": {
    "code": "not_found",
    "message": "bank account not found"
  }
}
```

#### Validation Error (`400 Bad Request`)

Same validation messages as `POST /api/bank-accounts`.

#### Conflict (`409 Conflict`)

```json
{
  "error": {
    "code": "duplicate_bank_account",
    "message": "bank, currency and account number combination must be unique"
  }
}
```

### `DELETE /api/bank-accounts/{id}`

#### Success (`204 No Content`)

No response body.

#### Not Found (`404 Not Found`)

```json
{
  "error": {
    "code": "not_found",
    "message": "bank account not found"
  }
}
```

#### Invalid ID (`400 Bad Request`)

Same as `GET /api/bank-accounts/{id}` invalid id response.
