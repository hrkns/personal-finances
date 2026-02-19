# Guide for adding an entity

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

## How to read AI-generated changes (diff guide for developers)

This section is specifically for the moment after you ask the AI agent to add a new entity and get a large PR/diff.

If the frontend diff feels much larger than backend: that is expected in this repository.
Backend usually adds fewer files with concentrated logic, while frontend touches composition, routing, DOM maps, module wiring, integration mock plumbing, and tests.

### Why frontend usually has more changed files than backend

For one new entity, frontend normally has to update:

- screen markup (tab + section + form + table)
- route and visibility rules
- DOM element map
- state store getters/setters
- module composition (dependency graph)
- module implementation
- integration mock store + handlers + registration
- integration test script order guard
- integration tests
- E2E tests

Backend is generally smaller because it is centralized around:

- one migration
- one API handler file
- one API test file
- one route registration line

### File-by-file explanation map (what changed and why)

Use this map to review generated diffs quickly.

#### Database layer

- `migrations/NNN_create_<entity>.sql`
  - **Why it changes**: introduces persistent schema for the new entity.
  - **What to check**: PK, nullability, uniqueness, FK delete/update behavior, indexes, defaults.
  - **Typical mistakes**: missing unique index, weak FK actions, defaults not matching API normalization.

#### Backend layer

- `backend/<entity>_api.go`
  - **Why it changes**: complete CRUD endpoint implementation.
  - **What to check**:
    - route constants and patterns
    - payload decoding/normalization
    - validation messages and HTTP codes
    - DB query correctness and `RowsAffected` checks
    - conflict and FK error mapping (`409`/`400`)

- `backend/api.go`
  - **Why it changes**: route registration is centralized.
  - **What to check**: exactly one registration call was added and path naming follows convention.

- `backend/<entity>_api_test.go`
  - **Why it changes**: entity-specific backend behavior coverage.
  - **What to check**:
    - CRUD happy path
    - invalid payload cases
    - duplicate conflict cases
    - invalid path-id behavior
    - helper seed data reflects FK dependencies

#### Frontend layer (most changes happen here)

- `web/index.html`
  - **Why it changes**: UI surface for tab/view/form/table.
  - **What to check**: IDs match module expectations exactly, no duplicated IDs, section placed at intended route level.

- `web/router.js`
  - **Why it changes**: route allows top-level or settings subsection navigation.
  - **What to check**: entity route is in the right set (`validRoutes` vs `validSettingsSections`).

- `web/app/dom.js`
  - **Why it changes**: central registry of element references consumed by modules.
  - **What to check**: all new IDs mapped; map location aligns with route hierarchy (`views` vs `settingsViews`).

- `web/app/state.js`
  - **Why it changes**: in-memory store for entity list state.
  - **What to check**: getter/setter added and used by composition module.

- `web/app/modules.js`
  - **Why it changes**: dependency injection + cross-module synchronization.
  - **What to check**:
    - module is created and returned
    - reference-data callbacks update dependent modules when needed
    - no circular init mistakes (e.g., using module before assignment)

- `web/app/index.js`
  - **Why it changes**: startup load + event listener wiring.
  - **What to check**: module `load()` included in initial `Promise.all`, submit/cancel handlers bound.

- `web/app/routing.js`
  - **Why it changes**: visibility toggles for views and active tab classes.
  - **What to check**: entity visibility follows intended hierarchy; no orphan section always hidden.

- `web/modules/<entity>.js`
  - **Why it changes**: entity UI behavior implementation.
  - **What to check**:
    - required API methods (`load`, `render`, `onSubmit`, `onRowAction`, `resetForm`, `setMessage`)
    - empty-state row handling
    - edit/delete button binding
    - option population (for FK selects)
    - message behavior on success/error

- `web/utils.js` and `web/utils.test.js` (optional)
  - **Why they change**: shared normalization/parsing helpers for new payload shape.
  - **What to check**: frontend normalization mirrors backend rules exactly.

#### Frontend integration-test support layer

- `web/test-support/fetch-mock/helpers.js`
  - **Why it changes**: adds in-memory stores and sequence counters.
  - **What to check**: store names consistent with handlers.

- `web/test-support/fetch-mock/handlers/handle-<entity>-collection.js`
- `web/test-support/fetch-mock/handlers/handle-<entity>-by-id.js`
  - **Why they change**: mock server emulates backend routes in integration tests.
  - **What to check**: duplicate and not-found semantics match backend messages/codes.

- `web/test-support/integration-fetch-mock.js`
  - **Why it changes**: registers the new handlers.
  - **What to check**: both collection and by-id handlers are included.

- `web/test-support/integration-scripts.js`
  - **Why it changes**: script-order guard must match `web/index.html`.
  - **What to check**: new module script is in exact order.

#### Tests + docs layer

- `web/modules/<entity>.integration.test.js`
  - **Why it changes**: JSDOM-level CRUD and conflict behavior tests.

- `e2e/<entity>.e2e.spec.js`
  - **Why it changes**: real browser flow with backend integration.

- `docs/api/NN-<entity>.md`, `docs/API.md`, `docs/TESTS.md`, `README.md`
  - **Why they change**: public contract, index updates, and runbook alignment.

### Suggested review order (to avoid getting stunned by large diff)

Review in this exact order:

1. Migration (`migrations/`) — confirm data model contract.
2. Backend API + tests (`backend/`) — confirm server contract and validations.
3. Frontend entry points (`web/index.html`, `web/router.js`, `web/app/*.js`) — confirm wiring.
4. Frontend module (`web/modules/<entity>.js`) — confirm UI behavior.
5. Integration test support (`web/test-support/`) — confirm test harness consistency.
6. Tests (`backend/*_test.go`, `web/modules/*.integration.test.js`, `e2e/*.spec.js`) — confirm behavior.
7. Docs (`docs/*`, `README.md`) — confirm contract is documented.

### Quick backend-focused checklist (for backend-heavy reviewers)

- Does `decode<...>Payload` enforce required fields and normalize optional ones?
- Do all invalid states return explicit, stable error messages?
- Are uniqueness conflicts mapped to `409` with a specific error code?
- Are FK checks explicit in validation, not only delegated to DB errors?
- Does update return `404` when `RowsAffected == 0`?
- Do tests cover at least one duplicate conflict and one invalid FK scenario?

### Quick frontend-focused checklist (for frontend-heavy reviewers)

- Is the entity placed at the correct route level (top tab vs settings tab)?
- Do IDs in `index.html` match `dom.js` keys exactly?
- Is state wired in `state.js`, composed in `modules.js`, loaded in `index.js`?
- Are dependent dropdowns refreshed when related entities change?
- Does integration script order still match `index.html`?
- Do integration tests assert both success and conflict messages?

### AI handoff expectation (what to ask the agent to include)

When requesting a new entity, also ask the AI agent to include this handoff block in its final message:

- **Files changed by layer** (DB, backend, frontend, test harness, tests, docs)
- **Why each file changed** (one line each)
- **Behavioral risks** (e.g., route hierarchy, FK dropdown dependencies)
- **Commands run + pass/fail output**

This turns a large diff into a reviewable checklist.

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
