# Transaction Categories API

Transaction categories support optional parent/child hierarchy.

### Transaction Category Object

```json
{
  "id": 1,
  "name": "Salary",
  "parent_id": null,
  "parent_name": null
}
```

### Transaction Category Payload

```json
{
  "name": "Job 1",
  "parent_id": 1
}
```

Normalization rules:

- `name` is trimmed

Validation rules:

- `name` required
- `parent_id` optional (`null` or omitted for root)
- when provided, `parent_id` must be a positive integer
- parent category must exist
- category cannot be its own parent
- category name must be unique under the same parent

### `GET /api/transaction-categories`

#### Success (`200 OK`)

```json
[
  {
    "id": 1,
    "name": "Salary",
    "parent_id": null,
    "parent_name": null
  },
  {
    "id": 2,
    "name": "Job 1",
    "parent_id": 1,
    "parent_name": "Salary"
  }
]
```

### `GET /api/transaction-categories/{id}`

#### Success (`200 OK`)

```json
{
  "id": 2,
  "name": "Job 1",
  "parent_id": 1,
  "parent_name": "Salary"
}
```

#### Not Found (`404 Not Found`)

```json
{
  "error": {
    "code": "not_found",
    "message": "transaction category not found"
  }
}
```

#### Invalid ID (`400 Bad Request`)

```json
{
  "error": {
    "code": "invalid_id",
    "message": "transaction category id must be a positive integer"
  }
}
```

### `POST /api/transaction-categories`

Request body: Transaction Category Payload.

#### Success (`201 Created`)

Headers:

- `Location: /api/transaction-categories/{id}`

Body:

```json
{
  "id": 2,
  "name": "Job 1",
  "parent_id": 1,
  "parent_name": "Salary"
}
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
    "message": "parent_id must be a positive integer"
  }
}
```

```json
{
  "error": {
    "code": "invalid_payload",
    "message": "parent category must exist"
  }
}
```

#### Conflict (`409 Conflict`)

```json
{
  "error": {
    "code": "duplicate_transaction_category",
    "message": "category name must be unique under the same parent"
  }
}
```

### `PUT /api/transaction-categories/{id}`

Request body: Transaction Category Payload.

#### Success (`200 OK`)

```json
{
  "id": 2,
  "name": "Job One",
  "parent_id": 1,
  "parent_name": "Salary"
}
```

#### Validation Error (`400 Bad Request`)

```json
{
  "error": {
    "code": "invalid_payload",
    "message": "category cannot be its own parent"
  }
}
```

#### Not Found (`404 Not Found`)

```json
{
  "error": {
    "code": "not_found",
    "message": "transaction category not found"
  }
}
```

#### Conflict (`409 Conflict`)

```json
{
  "error": {
    "code": "duplicate_transaction_category",
    "message": "category name must be unique under the same parent"
  }
}
```

### `DELETE /api/transaction-categories/{id}`

#### Success (`204 No Content`)

No response body.

#### Not Found (`404 Not Found`)

```json
{
  "error": {
    "code": "not_found",
    "message": "transaction category not found"
  }
}
```

#### Conflict (`409 Conflict`)

```json
{
  "error": {
    "code": "category_in_use",
    "message": "transaction category is in use"
  }
}
```

#### Invalid ID (`400 Bad Request`)

Same as `GET /api/transaction-categories/{id}` invalid id response.
