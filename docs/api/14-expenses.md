# Expenses API

Base path: `/api/expenses`

Expense payload attributes:

- `name` (string, required, unique, not blank)
- `frequency` (string, required, one of: `daily`, `weekly`, `monthly`, `annually`)

## List expenses

- Method: `GET`
- Path: `/api/expenses`
- Success: `200 OK`

Response:

```json
[
  {
    "id": 1,
    "name": "Rent",
    "frequency": "monthly"
  }
]
```

## Create expense

- Method: `POST`
- Path: `/api/expenses`
- Success: `201 Created`
- Headers: `Location: /api/expenses/{id}`

Request body:

```json
{
  "name": "Gym",
  "frequency": "weekly"
}
```

Validation errors (`400 Bad Request`):

- `name is required`
- `frequency is required`
- `frequency must be one of: daily, weekly, monthly, annually`

Conflict (`409 Conflict`):

- `duplicate_expense`: `expense name must be unique`

## Get expense by id

- Method: `GET`
- Path: `/api/expenses/{id}`
- Success: `200 OK`

Not found (`404 Not Found`):

- `expense not found`

## Update expense

- Method: `PUT`
- Path: `/api/expenses/{id}`
- Success: `200 OK`

Request body:

```json
{
  "name": "Gym Premium",
  "frequency": "monthly"
}
```

Validation and conflict rules are the same as create.

## Delete expense

- Method: `DELETE`
- Path: `/api/expenses/{id}`
- Success: `204 No Content`

Not found (`404 Not Found`):

- `expense not found`
