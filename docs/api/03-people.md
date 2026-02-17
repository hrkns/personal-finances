# People API

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
