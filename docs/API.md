# REST API Documentation

## Base URL

For local development:

- `http://localhost:8080`

All API endpoints are under:

- `/api/*`

## Content Type

- Requests with body: `Content-Type: application/json`
- Responses: `application/json` (except `204 No Content`)

## Error Response Format

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

---

## Health

### `GET /api/health`

Checks backend availability.

#### Success (`200 OK`)

```json
{
  "status": "ok",
  "message": "backend is up"
}
```

---

## Countries

Countries are stored in database (`countries` table) and seeded through migrations.

### Country Object

```json
{
  "code": "US",
  "name": "United States"
}
```

### `GET /api/countries`

Returns all countries ordered by code.

#### Success (`200 OK`)

```json
[
  { "code": "AD", "name": "Andorra" },
  { "code": "AE", "name": "United Arab Emirates" }
]
```

### Method Not Allowed (`405`)

Any non-`GET` method returns:

```json
{
  "error": {
    "code": "method_not_allowed",
    "message": "method not allowed"
  }
}
```

---

## People

### Person Object

```json
{
  "id": 1,
  "name": "John Doe"
}
```

### Person Payload

```json
{
  "name": "John Doe"
}
```

Normalization rules:

- `name` is trimmed

Validation rules:

- `name` required

### `GET /api/people`

#### Success (`200 OK`)

```json
[
  { "id": 1, "name": "John Doe" }
]
```

### `GET /api/people/{id}`

#### Success (`200 OK`)

```json
{ "id": 1, "name": "John Doe" }
```

#### Not Found (`404 Not Found`)

```json
{
  "error": {
    "code": "not_found",
    "message": "person not found"
  }
}
```

#### Invalid ID (`400 Bad Request`)

```json
{
  "error": {
    "code": "invalid_id",
    "message": "person id must be a positive integer"
  }
}
```

### `POST /api/people`

Request body: Person Payload.

#### Success (`201 Created`)

Headers:

- `Location: /api/people/{id}`

Body:

```json
{ "id": 1, "name": "John Doe" }
```

#### Validation Error (`400 Bad Request`)

```json
{
  "error": {
    "code": "invalid_payload",
    "message": "name is required"
  }
}
```

### `PUT /api/people/{id}`

Request body: Person Payload.

#### Success (`200 OK`)

```json
{ "id": 1, "name": "John Doe Updated" }
```

#### Not Found (`404 Not Found`)

```json
{
  "error": {
    "code": "not_found",
    "message": "person not found"
  }
}
```

#### Invalid ID (`400 Bad Request`)

Same as `GET /api/people/{id}` invalid id response.

### `DELETE /api/people/{id}`

#### Success (`204 No Content`)

No response body.

#### Not Found (`404 Not Found`)

```json
{
  "error": {
    "code": "not_found",
    "message": "person not found"
  }
}
```

#### Invalid ID (`400 Bad Request`)

Same as `GET /api/people/{id}` invalid id response.

---

## Currencies

### Currency Object

```json
{
  "id": 1,
  "name": "US Dollar",
  "code": "USD"
}
```

### Currency Payload

```json
{
  "name": "US Dollar",
  "code": "usd"
}
```

Normalization rules:

- `name` is trimmed
- `code` is trimmed and uppercased

Validation rules:

- `name` required
- `code` required
- `name` unique (case-insensitive DB collation)
- `code` unique (case-insensitive DB collation)

### `GET /api/currencies`

#### Success (`200 OK`)

```json
[
  { "id": 1, "name": "US Dollar", "code": "USD" }
]
```

### `GET /api/currencies/{id}`

#### Success (`200 OK`)

```json
{ "id": 1, "name": "US Dollar", "code": "USD" }
```

#### Not Found (`404 Not Found`)

```json
{
  "error": {
    "code": "not_found",
    "message": "currency not found"
  }
}
```

#### Invalid ID (`400 Bad Request`)

```json
{
  "error": {
    "code": "invalid_id",
    "message": "currency id must be a positive integer"
  }
}
```

### `POST /api/currencies`

Request body: Currency Payload.

#### Success (`201 Created`)

Headers:

- `Location: /api/currencies/{id}`

Body:

```json
{ "id": 1, "name": "US Dollar", "code": "USD" }
```

#### Validation Error (`400 Bad Request`)

Examples:

```json
{
  "error": {
    "code": "invalid_payload",
    "message": "name is required"
  }
}
```

```json
{
  "error": {
    "code": "invalid_payload",
    "message": "code is required"
  }
}
```

#### Conflict (`409 Conflict`)

```json
{
  "error": {
    "code": "duplicate_currency",
    "message": "name and code must be unique"
  }
}
```

### `PUT /api/currencies/{id}`

Request body: Currency Payload.

#### Success (`200 OK`)

```json
{ "id": 1, "name": "US Dollar Updated", "code": "USDX" }
```

#### Not Found (`404 Not Found`)

```json
{
  "error": {
    "code": "not_found",
    "message": "currency not found"
  }
}
```

#### Conflict (`409 Conflict`)

```json
{
  "error": {
    "code": "duplicate_currency",
    "message": "name and code must be unique"
  }
}
```

#### Invalid ID (`400 Bad Request`)

Same as `GET /api/currencies/{id}` invalid id response.

### `DELETE /api/currencies/{id}`

#### Success (`204 No Content`)

No response body.

#### Not Found (`404 Not Found`)

```json
{
  "error": {
    "code": "not_found",
    "message": "currency not found"
  }
}
```

#### Invalid ID (`400 Bad Request`)

Same as `GET /api/currencies/{id}` invalid id response.

---

## Banks

Banks reference countries by country code. Country validity is enforced through the `countries` table and bank foreign key.

### Bank Object

```json
{
  "id": 1,
  "name": "Bank of Test",
  "country": "US"
}
```

### Bank Payload

```json
{
  "name": "Bank of Test",
  "country": "us"
}
```

Normalization rules:

- `name` is trimmed
- `country` is trimmed and uppercased

Validation rules:

- `name` required
- `country` required
- (`name`, `country`) combination unique
- `country` must exist in `countries(code)`

### `GET /api/banks`

#### Success (`200 OK`)

```json
[
  { "id": 1, "name": "Bank of Test", "country": "US" }
]
```

### `GET /api/banks/{id}`

#### Success (`200 OK`)

```json
{ "id": 1, "name": "Bank of Test", "country": "US" }
```

#### Not Found (`404 Not Found`)

```json
{
  "error": {
    "code": "not_found",
    "message": "bank not found"
  }
}
```

#### Invalid ID (`400 Bad Request`)

```json
{
  "error": {
    "code": "invalid_id",
    "message": "bank id must be a positive integer"
  }
}
```

### `POST /api/banks`

Request body: Bank Payload.

#### Success (`201 Created`)

Headers:

- `Location: /api/banks/{id}`

Body:

```json
{ "id": 1, "name": "Bank of Test", "country": "US" }
```

#### Validation Error (`400 Bad Request`)

Examples:

```json
{
  "error": {
    "code": "invalid_payload",
    "message": "name is required"
  }
}
```

```json
{
  "error": {
    "code": "invalid_payload",
    "message": "country is required"
  }
}
```

```json
{
  "error": {
    "code": "invalid_payload",
    "message": "country must exist"
  }
}
```

#### Conflict (`409 Conflict`)

```json
{
  "error": {
    "code": "duplicate_bank",
    "message": "name and country combination must be unique"
  }
}
```

### `PUT /api/banks/{id}`

Request body: Bank Payload.

#### Success (`200 OK`)

```json
{ "id": 1, "name": "Bank Updated", "country": "CA" }
```

#### Not Found (`404 Not Found`)

```json
{
  "error": {
    "code": "not_found",
    "message": "bank not found"
  }
}
```

#### Validation Error (`400 Bad Request`)

```json
{
  "error": {
    "code": "invalid_payload",
    "message": "country must exist"
  }
}
```

#### Conflict (`409 Conflict`)

```json
{
  "error": {
    "code": "duplicate_bank",
    "message": "name and country combination must be unique"
  }
}
```

### `DELETE /api/banks/{id}`

#### Success (`204 No Content`)

No response body.

#### Not Found (`404 Not Found`)

```json
{
  "error": {
    "code": "not_found",
    "message": "bank not found"
  }
}
```

#### Invalid ID (`400 Bad Request`)

Same as `GET /api/banks/{id}` invalid id response.

---

## Bank Accounts

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
