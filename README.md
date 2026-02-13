# Personal Finances
Web application for managing personal finances.

## Run the app

From the project root, run:

```bash
go run .
```

Then open:

- Frontend: http://localhost:8080
- Backend test endpoint: http://localhost:8080/api/health

## Database integration

This app uses SQLite for local development.

- Default DB file: `data/personal_finances.db`
- Optional custom path: set `DATABASE_PATH`

### Why migrations

Database infrastructure is managed with SQL migrations (`migrations/*.sql`) applied automatically at startup.

This keeps schema changes versioned, reviewable, and repeatable without requiring a separate migration command in this first iteration.

## Currency API (REST)

- `GET /api/currencies` → `200 OK` + array
- `GET /api/currencies/{id}` → `200 OK` or `404 Not Found`
- `POST /api/currencies` → `201 Created` + created object (`name`, `code` unique)
- `PUT /api/currencies/{id}` → `200 OK`, `404 Not Found`, or `409 Conflict` for unique violations
- `DELETE /api/currencies/{id}` → `204 No Content` or `404 Not Found`

Validation and failure responses are JSON with an `error` object.
