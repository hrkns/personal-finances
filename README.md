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

## Project structure

- `main.go`: application entrypoint
- `backend/`: API handlers, routing, database setup, backend tests
- `web/`: frontend HTML, CSS, JS modules, frontend unit/integration tests
- `e2e/`: Playwright end-to-end tests
- `migrations/`: SQLite schema and seed migrations
- `docs/`: API and tests documentation

## Documentation

- Frontend views: [docs/VIEWS.md](docs/VIEWS.md)
- Database integration: [docs/DB.md](docs/DB.md)
- Guide for adding an entity: [docs/GUIDE_FOR_ADDING_AN_ENTITY.md](docs/GUIDE_FOR_ADDING_AN_ENTITY.md)
- REST API documentation index: [docs/API.md](docs/API.md)
- Split API resource docs: [docs/api/](docs/api)
- Tests documentation: [docs/TESTS.md](docs/TESTS.md)
- Linting documentation: [docs/LINTING.md](docs/LINTING.md)

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
