# Currencies API

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
