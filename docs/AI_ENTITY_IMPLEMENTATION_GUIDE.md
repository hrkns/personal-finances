# AI Entity Implementation Guide

This document explains how to add a new entity to this codebase using an AI coding agent, including expected outputs, repository conventions, and how to verify current project status.

## Purpose

Use this guide when you want to introduce a new domain entity (example: `budgets`, `tags`, `merchants`) with complete support across:

- database migration
- backend REST API
- frontend UI module and routing
- unit/integration/E2E tests
- API/tests documentation

## What “done” means in this repo

An entity is considered complete only when all layers are updated:

1. **DB**: migration exists and applies on startup.
2. **Backend**: CRUD routes and validations implemented.
3. **Frontend**: tab/view/form/table integrated in the app.
4. **Test support**: fetch mock handlers for integration tests are added.
5. **Tests**: backend + frontend integration + E2E coverage exists.
6. **Docs**: API and tests docs reflect behavior and files.

---

## Current codebase status (reference baseline)

As of now, end-to-end entities are:

- `currencies`
- `banks`
- `bank_accounts`
- `credit_cards`
- `people`
- `transaction_categories`
- `transactions`

### Structure currently used

- **Migrations**: `migrations/00x_*.sql`
- **Backend handlers/tests**:
  - `backend/<entity>_api.go`
  - `backend/<entity>_api_test.go`
- **Frontend modules/integration tests**:
  - `web/modules/<entity>.js`
  - `web/modules/<entity>.integration.test.js`
- **Integration fetch mock handlers**:
  - `web/test-support/fetch-mock/handlers/handle-<entity>-collection.js`
  - `web/test-support/fetch-mock/handlers/handle-<entity>-by-id.js`
- **E2E**: `e2e/<entity>.e2e.spec.js`
- **API docs**: `docs/api/NN-<entity>.md` + link in `docs/API.md`

---

## Recommended AI-agent workflow

## 1) Define the entity contract first

Before asking the agent to code, provide:

- table name
- fields + types + nullability
- validation rules
- uniqueness rules
- foreign keys and delete behavior (`RESTRICT`/`CASCADE`)
- API payload and response shape
- UI requirements (minimum MVP fields/actions)

Tip: be explicit about edge cases (blank strings, invalid IDs, default values, enums, date-only vs datetime).

## 2) Ask for phased implementation

Use one prompt that enforces sequence and validation:

1. Add migration.
2. Add backend handler + tests.
3. Wire routes.
4. Add frontend module + app wiring + route/tab/view.
5. Add integration fetch mock handlers.
6. Add integration tests.
7. Add E2E test.
8. Update docs.
9. Run `go test ./...`, `npm run test:frontend`, `npm run test:frontend:e2e`.

This reduces partial implementations.

## 3) Make the agent follow repo conventions

Important conventions in this repo:

- route registration is centralized in `backend/api.go`
- frontend routes are controlled by `web/router.js` and `web/app/routing.js`
- app composition/wiring lives in `web/app/*.js`
- integration test script order must match `web/index.html` and is guarded in `web/test-support/integration-scripts.js`
- integration fetch handlers are modular and composed in `web/test-support/integration-fetch-mock.js`

## 4) Require full test pass before handoff

Agent output should include command results and pass/fail status for:

- backend: `go test ./...`
- frontend unit+integration: `npm run test:frontend`
- browser E2E: `npm run test:frontend:e2e`

---

## Detailed implementation checklist

### A) Database layer

- Add next migration file in `migrations/` with ordered prefix.
- Add table, constraints, indexes.
- Ensure foreign keys align with business rules.
- Ensure defaults and checks are explicit (do not rely on UI only).

### B) Backend layer

- Add `backend/<entity>_api.go`:
  - path constants
  - entity/payload structs
  - collection and by-id handlers
  - list/get/create/update/delete
  - decode + normalize + validate helpers
- Register routes in `backend/api.go`.
- Add `backend/<entity>_api_test.go`:
  - happy-path CRUD flow
  - validation errors
  - conflict/constraint scenarios
  - invalid ID path test

### C) Frontend layer

- Add `web/modules/<entity>.js` with:
  - `load`, `render`, `onSubmit`, `onRowAction`, `resetForm`, `setMessage`
- Add UI in `web/index.html`:
  - tab button
  - section/view
  - form fields
  - table body
- Wire app internals:
  - `web/app/dom.js` elements map
  - `web/app/state.js` getters/setters
  - `web/app/modules.js` module composition
  - `web/app/index.js` load + event listeners
  - route additions in `web/router.js` and `web/app/routing.js`
- If needed, add new normalization helper in `web/utils.js` and tests in `web/utils.test.js`.

### D) Integration testing support

- Add in-memory stores in `web/test-support/fetch-mock/helpers.js`.
- Add handlers for collection and by-id routes.
- Register handlers in `web/test-support/integration-fetch-mock.js`.
- Add script file to `web/test-support/integration-scripts.js` in the exact order used by `web/index.html`.

### E) Tests

- Backend test file: `backend/<entity>_api_test.go`.
- Frontend integration test file: `web/modules/<entity>.integration.test.js`.
- E2E file: `e2e/<entity>.e2e.spec.js`.

### F) Documentation

- Add API doc file under `docs/api/` and index it in `docs/API.md`.
- Update `docs/TESTS.md` with added coverage and new test file paths.
- Update `README.md` if route/tab/docs links change.

---

## Prompt template you can give to the AI agent

Use this template and replace bracketed values:

```text
Implement full [ENTITY_NAME] management end-to-end in this repository.

Requirements:
- Data model: [FIELDS, TYPES, NULLABILITY]
- Validation rules: [RULES]
- API routes: [COLLECTION + BY-ID ROUTES]
- UI scope: tab + form + table + CRUD only (MVP)
- Keep architecture and naming consistent with existing modules.

Do in this order:
1) migration
2) backend API + tests
3) frontend module/wiring
4) integration fetch mock handlers
5) frontend integration tests
6) E2E test
7) docs updates

Then run and report:
- go test ./...
- npm run test:frontend
- npm run test:frontend:e2e
```

---

## Common pitfalls (and how to avoid them)

- **Script order drift in integration tests**: keep `web/test-support/integration-scripts.js` aligned with `web/index.html`.
- **Backend/frontend validation mismatch**: duplicate key normalization rules in both layers and test both.
- **Forgotten route wiring**: new module exists but route not visible because `web/router.js` or `web/app/routing.js` missed.
- **Foreign key behavior surprises**: explicitly test delete/update conflicts in backend tests.
- **Docs lagging code**: always update `docs/API.md`, `docs/api/*`, and `docs/TESTS.md` in same PR.

---

## PR-quality acceptance checklist

Before merging, verify all are true:

- [ ] Migration added and applies cleanly.
- [ ] Backend CRUD and validations covered by tests.
- [ ] Frontend view/module wired and reachable via tab/route.
- [ ] Integration fetch mocks include new routes.
- [ ] Frontend integration and E2E tests added.
- [ ] API and test docs updated.
- [ ] All test commands pass.

If any box is unchecked, implementation is partial.
