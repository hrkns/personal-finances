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
- `POST /api/banks` → `201 Created` + created object (`name`+`country` unique)
- `PUT /api/banks/{id}` → `200 OK`, `404 Not Found`, or `409 Conflict` for unique violations
- `DELETE /api/banks/{id}` → `204 No Content` or `404 Not Found`

`country` uses all ISO 3166-1 alpha-2 country codes:

`AD, AE, AF, AG, AI, AL, AM, AO, AQ, AR, AS, AT, AU, AW, AX, AZ, BA, BB, BD, BE, BF, BG, BH, BI, BJ, BL, BM, BN, BO, BQ, BR, BS, BT, BV, BW, BY, BZ, CA, CC, CD, CF, CG, CH, CI, CK, CL, CM, CN, CO, CR, CU, CV, CW, CX, CY, CZ, DE, DJ, DK, DM, DO, DZ, EC, EE, EG, EH, ER, ES, ET, FI, FJ, FK, FM, FO, FR, GA, GB, GD, GE, GF, GG, GH, GI, GL, GM, GN, GP, GQ, GR, GS, GT, GU, GW, GY, HK, HM, HN, HR, HT, HU, ID, IE, IL, IM, IN, IO, IQ, IR, IS, IT, JE, JM, JO, JP, KE, KG, KH, KI, KM, KN, KP, KR, KW, KY, KZ, LA, LB, LC, LI, LK, LR, LS, LT, LU, LV, LY, MA, MC, MD, ME, MF, MG, MH, MK, ML, MM, MN, MO, MP, MQ, MR, MS, MT, MU, MV, MW, MX, MY, MZ, NA, NC, NE, NF, NG, NI, NL, NO, NP, NR, NU, NZ, OM, PA, PE, PF, PG, PH, PK, PL, PM, PN, PR, PS, PT, PW, PY, QA, RE, RO, RS, RU, RW, SA, SB, SC, SD, SE, SG, SH, SI, SJ, SK, SL, SM, SN, SO, SR, SS, ST, SV, SX, SY, SZ, TC, TD, TF, TG, TH, TJ, TK, TL, TM, TN, TO, TR, TT, TV, TW, TZ, UA, UG, UM, US, UY, UZ, VA, VC, VE, VG, VI, VN, VU, WF, WS, YE, YT, ZA, ZM, ZW`

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
