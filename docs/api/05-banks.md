# Banks API

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
