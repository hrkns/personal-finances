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

Frontend views are tab-based and route through the `view` query parameter:

- Home: `/?view=home` (or `/`)
- Banks: `/?view=banks`
- Currency: `/?view=currency`

Invalid `view` values are normalized to Home.

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

## Bank API (REST)

- `GET /api/banks` → `200 OK` + array
- `GET /api/banks/{id}` → `200 OK` or `404 Not Found`
- `POST /api/banks` → `201 Created` + created object (`name`+`country` unique; `country` must exist in countries table)
- `PUT /api/banks/{id}` → `200 OK`, `404 Not Found`, or `409 Conflict` for unique violations
- `DELETE /api/banks/{id}` → `204 No Content` or `404 Not Found`

## Countries API (REST)

- `GET /api/countries` → `200 OK` + array of `{ code, name }`

Countries are seeded in the database with ISO 3166-1 alpha-2 entries and used by the frontend to render bank country options.

## Tests

### Backend unit tests

Run all Go tests:

```bash
go test ./...
```

### Frontend unit tests

Run frontend unit tests (Node.js built-in test runner):

```bash
npm run test:frontend:unit
```

The frontend tests cover utility behavior used by the UI layer (`normalizeCurrencyInput`, `escapeHtml`, API response parsing).

### Frontend integration tests

Run frontend integration tests (DOM + app script execution with mocked API):

```bash
npm run test:frontend:integration
```

To run all frontend tests together:

```bash
npm run test:frontend
```

### Frontend E2E tests

E2E tests run against the real app (`go run .`) and exercise the UI in a real browser via Playwright.

Install browser binaries (first time only):

```bash
npx playwright install chromium
```

Run E2E tests:

```bash
npm run test:frontend:e2e
```
