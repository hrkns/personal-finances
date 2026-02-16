# Tests Documentation

## Test Suites

The project includes:

- Backend tests (Go, `go test`)
- Frontend unit tests (Node test runner)
- Frontend integration tests (Node + JSDOM)
- Frontend E2E tests (Playwright)

## Backend Tests

Run all backend tests:

```bash
go test ./...
```

Covered areas include:

- Health endpoint behavior
- Currency CRUD and validations
- Bank CRUD and validations
- Countries endpoint behavior
- Migration-backed test setup through temp SQLite DB

## Frontend Unit Tests

Run:

```bash
npm run test:frontend:unit
```

Current focus:

- Utility functions in `web/utils.js`
  - `normalizeCurrencyInput`
  - `normalizeBankInput`
  - `escapeHtml`
  - `parseApiResponse`

## Frontend Integration Tests

Run:

```bash
npm run test:frontend:integration
```

These tests execute `index.html` + scripts in JSDOM with a mocked `fetch`, validating:

- Router and view switching basics
- Currency form/table flows
- Bank form/table flows
- Error handling on duplicate constraints
- Country options loaded from `/api/countries`

## Frontend Combined (Unit + Integration)

Run both frontend unit and integration tests:

```bash
npm run test:frontend
```

## Frontend E2E (Playwright)

Install browser binaries once:

```bash
npx playwright install chromium
```

Run E2E tests:

```bash
npm run test:frontend:e2e
```

E2E details:

- Spins up app with `go run .`
- Uses isolated sqlite database via `DATABASE_PATH`
- Covers browser-level Currency and Bank flows
- Verifies conflict scenarios and UI messages

## Typical Local Validation Order

1. `go test ./...`
2. `npm run test:frontend`
3. `npm run test:frontend:e2e`

This order gives quick backend/frontend feedback before browser-level E2E.
