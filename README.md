# Personal Finances
Web application for managing personal finances.

## Motivation and technology choices

This project starts from a recurring real-life activity: tracking incomes and expenses in a spreadsheet.
The goal is to translate that manual workflow into a lightweight web app that is easier to use day to day,
while also serving as a hands-on learning space.

### Why Go

Go is used in the backend mainly as a learning choice: the project is an opportunity to practice a new
technology in a practical context (HTTP APIs, database integration, routing, and testing).

### Why vanilla JavaScript (and no UI library for now)

The frontend intentionally uses vanilla JavaScript to keep the first iteration simple and lightweight.
For the moment, no UI library/framework is used for the same reason: reduce abstraction, keep control of
the fundamentals, and avoid unnecessary complexity while the core product is being shaped.

### AI agent as development helper

Another core goal is to learn and iterate with AI-assisted development.
An AI coding agent is used as a helper to speed up implementation, review code, suggest improvements,
and provide continuous feedback during development.

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
- Transactions: `/?view=transactions`
- Credit Cards: `/?view=credit-cards`
- Settings: `/?view=settings`

Within Credit Cards, `creditCards` query parameter controls which subsection is open:

- Cards: `/?view=credit-cards&creditCards=cards`
- Cycles: `/?view=credit-cards&creditCards=cycles`
- Installments: `/?view=credit-cards&creditCards=installments`

Within Settings, `settings` query parameter controls which management section is open:

- Transaction Categories: `/?view=settings&settings=transaction-categories`
- People: `/?view=settings&settings=people`
- Bank Accounts: `/?view=settings&settings=bank-accounts`
- Banks: `/?view=settings&settings=banks`
- Currency: `/?view=settings&settings=currency`

Invalid `view` values are normalized to Home.

## Database integration

This app uses SQLite for local development.

- Default DB file: `data/personal_finances.db`
- Optional custom path: set `DATABASE_PATH`

Backend Go code is organized under `backend/`.

- Root entrypoint: `main.go`
- API, database setup, and backend tests: `backend/*.go`

### Why migrations

Database infrastructure is managed with SQL migrations (`migrations/*.sql`) applied automatically at startup.

This keeps schema changes versioned, reviewable, and repeatable without requiring a separate migration command in this first iteration.

## Project structure

- `main.go`: application entrypoint
- `backend/`: API handlers, routing, database setup, backend tests
- `web/`: frontend HTML, CSS, JS modules, frontend unit/integration tests
- `e2e/`: Playwright end-to-end tests
- `migrations/`: SQLite schema and seed migrations
- `docs/`: API and tests documentation

## Documentation

- Guide for adding an entity: [docs/GUIDE_FOR_ADDING_AN_ENTITY.md](docs/GUIDE_FOR_ADDING_AN_ENTITY.md)
- REST API documentation index: [docs/API.md](docs/API.md)
- Split API resource docs: [docs/api/](docs/api)
- Tests documentation: [docs/TESTS.md](docs/TESTS.md)
