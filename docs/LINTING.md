# Linting

This project includes linting for both JavaScript and Go code.

## Commands

Run all linters:

```bash
npm run lint
```

Run only JavaScript lint:

```bash
npm run lint:js
```

Auto-fix JavaScript lint issues when possible:

```bash
npm run lint:js:fix
```

Run only Go lint:

```bash
npm run lint:go
```

Run Go lint with formatting check:

```bash
npm run lint:go:fmtcheck
```

## What each linter does

- `lint:js` runs ESLint using `eslint.config.js` across project JavaScript files.
- `lint:go` runs `go vet ./...` through `scripts/lint-go.js`.
- `lint:go:fmtcheck` runs:
  - `gofmt -l` on all `.go` files
  - `go vet ./...`

## Notes

- `lint` currently uses `lint:go` (without `gofmt` check) to avoid blocking on historical formatting in untouched Go files.
- Use `lint:go:fmtcheck` when you want strict Go formatting validation.
