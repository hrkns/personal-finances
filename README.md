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

## Documentation

- REST API documentation: [docs/API.md](docs/API.md)
- Tests documentation: [docs/TESTS.md](docs/TESTS.md)
