package main

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"

	_ "modernc.org/sqlite"
)

const serverAddress = ":8080"

type app struct {
	db *sql.DB
}

type currency struct {
	ID   int64  `json:"id"`
	Name string `json:"name"`
	Code string `json:"code"`
}

type currencyPayload struct {
	Name string `json:"name"`
	Code string `json:"code"`
}

type apiError struct {
	Error errorBody `json:"error"`
}

type errorBody struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

func main() {
	databasePath := os.Getenv("DATABASE_PATH")
	if strings.TrimSpace(databasePath) == "" {
		databasePath = filepath.Join("data", "personal_finances.db")
	}

	db, err := setupDatabase(databasePath)
	if err != nil {
		log.Fatalf("database setup failed: %v", err)
	}
	defer db.Close()

	application := app{db: db}

	mux := http.NewServeMux()
	mux.HandleFunc("/api/health", healthHandler)
	mux.HandleFunc("/api/currencies", application.currenciesHandler)
	mux.HandleFunc("/api/currencies/", application.currencyByIDHandler)
	mux.Handle("/", http.FileServer(http.Dir("web")))

	log.Printf("Server is running on http://localhost%s", serverAddress)
	if err = http.ListenAndServe(serverAddress, mux); err != nil {
		log.Fatalf("server failed: %v", err)
	}
}

func healthHandler(writer http.ResponseWriter, _ *http.Request) {
	writer.Header().Set("Content-Type", "application/json")
	writer.WriteHeader(http.StatusOK)

	response := map[string]string{
		"status":  "ok",
		"message": "backend is up",
	}

	if err := json.NewEncoder(writer).Encode(response); err != nil {
		http.Error(writer, "failed to encode response", http.StatusInternalServerError)
	}
}

func setupDatabase(path string) (*sql.DB, error) {
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return nil, fmt.Errorf("create db directory: %w", err)
	}

	db, err := sql.Open("sqlite", path)
	if err != nil {
		return nil, fmt.Errorf("open db: %w", err)
	}

	if err = db.Ping(); err != nil {
		return nil, fmt.Errorf("ping db: %w", err)
	}

	if err = applyMigrations(db, "migrations"); err != nil {
		return nil, fmt.Errorf("apply migrations: %w", err)
	}

	return db, nil
}

func applyMigrations(db *sql.DB, migrationsDir string) error {
	if _, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS schema_migrations (
			version TEXT PRIMARY KEY,
			applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
		)
	`); err != nil {
		return err
	}

	entries, err := os.ReadDir(migrationsDir)
	if err != nil {
		if errors.Is(err, fs.ErrNotExist) {
			return nil
		}
		return err
	}

	files := make([]string, 0, len(entries))
	for _, entry := range entries {
		if entry.IsDir() || !strings.HasSuffix(entry.Name(), ".sql") {
			continue
		}
		files = append(files, entry.Name())
	}
	sort.Strings(files)

	for _, file := range files {
		var count int
		if err = db.QueryRow("SELECT COUNT(1) FROM schema_migrations WHERE version = ?", file).Scan(&count); err != nil {
			return err
		}
		if count > 0 {
			continue
		}

		sqlBytes, readErr := os.ReadFile(filepath.Join(migrationsDir, file))
		if readErr != nil {
			return readErr
		}

		tx, beginErr := db.Begin()
		if beginErr != nil {
			return beginErr
		}

		if _, execErr := tx.Exec(string(sqlBytes)); execErr != nil {
			tx.Rollback()
			return execErr
		}

		if _, insertErr := tx.Exec("INSERT INTO schema_migrations(version) VALUES (?)", file); insertErr != nil {
			tx.Rollback()
			return insertErr
		}

		if commitErr := tx.Commit(); commitErr != nil {
			return commitErr
		}
	}

	return nil
}

func (application app) currenciesHandler(writer http.ResponseWriter, request *http.Request) {
	switch request.Method {
	case http.MethodGet:
		application.listCurrencies(writer)
	case http.MethodPost:
		application.createCurrency(writer, request)
	default:
		methodNotAllowed(writer, http.MethodGet, http.MethodPost)
	}
}

func (application app) currencyByIDHandler(writer http.ResponseWriter, request *http.Request) {
	id, err := parseIDFromPath(request.URL.Path, "/api/currencies/")
	if err != nil {
		writeError(writer, http.StatusBadRequest, "invalid_id", "currency id must be a positive integer")
		return
	}

	switch request.Method {
	case http.MethodGet:
		application.getCurrency(writer, id)
	case http.MethodPut:
		application.updateCurrency(writer, request, id)
	case http.MethodDelete:
		application.deleteCurrency(writer, id)
	default:
		methodNotAllowed(writer, http.MethodGet, http.MethodPut, http.MethodDelete)
	}
}

func (application app) listCurrencies(writer http.ResponseWriter) {
	rows, err := application.db.Query(`SELECT id, name, code FROM currencies ORDER BY id`)
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to load currencies")
		return
	}
	defer rows.Close()

	items := make([]currency, 0)
	for rows.Next() {
		var item currency
		if scanErr := rows.Scan(&item.ID, &item.Name, &item.Code); scanErr != nil {
			writeError(writer, http.StatusInternalServerError, "internal_error", "failed to read currencies")
			return
		}
		items = append(items, item)
	}

	writeJSON(writer, http.StatusOK, items)
}

func (application app) getCurrency(writer http.ResponseWriter, id int64) {
	var item currency
	err := application.db.QueryRow(`SELECT id, name, code FROM currencies WHERE id = ?`, id).Scan(&item.ID, &item.Name, &item.Code)
	if errors.Is(err, sql.ErrNoRows) {
		writeError(writer, http.StatusNotFound, "not_found", "currency not found")
		return
	}
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to load currency")
		return
	}

	writeJSON(writer, http.StatusOK, item)
}

func (application app) createCurrency(writer http.ResponseWriter, request *http.Request) {
	payload, validationErr := decodeCurrencyPayload(request)
	if validationErr != nil {
		writeError(writer, http.StatusBadRequest, "invalid_payload", validationErr.Error())
		return
	}

	result, err := application.db.Exec(`INSERT INTO currencies(name, code) VALUES (?, ?)`, payload.Name, payload.Code)
	if err != nil {
		if isUniqueConstraintError(err) {
			writeError(writer, http.StatusConflict, "duplicate_currency", "name and code must be unique")
			return
		}
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to create currency")
		return
	}

	id, err := result.LastInsertId()
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to read created currency id")
		return
	}

	created := currency{ID: id, Name: payload.Name, Code: payload.Code}
	writer.Header().Set("Location", fmt.Sprintf("/api/currencies/%d", id))
	writeJSON(writer, http.StatusCreated, created)
}

func (application app) updateCurrency(writer http.ResponseWriter, request *http.Request, id int64) {
	payload, validationErr := decodeCurrencyPayload(request)
	if validationErr != nil {
		writeError(writer, http.StatusBadRequest, "invalid_payload", validationErr.Error())
		return
	}

	result, err := application.db.Exec(`UPDATE currencies SET name = ?, code = ? WHERE id = ?`, payload.Name, payload.Code, id)
	if err != nil {
		if isUniqueConstraintError(err) {
			writeError(writer, http.StatusConflict, "duplicate_currency", "name and code must be unique")
			return
		}
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to update currency")
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to read update result")
		return
	}
	if rowsAffected == 0 {
		writeError(writer, http.StatusNotFound, "not_found", "currency not found")
		return
	}

	updated := currency{ID: id, Name: payload.Name, Code: payload.Code}
	writeJSON(writer, http.StatusOK, updated)
}

func (application app) deleteCurrency(writer http.ResponseWriter, id int64) {
	result, err := application.db.Exec(`DELETE FROM currencies WHERE id = ?`, id)
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to delete currency")
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to read delete result")
		return
	}
	if rowsAffected == 0 {
		writeError(writer, http.StatusNotFound, "not_found", "currency not found")
		return
	}

	writer.WriteHeader(http.StatusNoContent)
}

func decodeCurrencyPayload(request *http.Request) (currencyPayload, error) {
	defer request.Body.Close()

	var payload currencyPayload
	if err := json.NewDecoder(request.Body).Decode(&payload); err != nil {
		return currencyPayload{}, fmt.Errorf("request body must be valid JSON")
	}

	payload.Name = strings.TrimSpace(payload.Name)
	payload.Code = strings.ToUpper(strings.TrimSpace(payload.Code))

	if payload.Name == "" {
		return currencyPayload{}, fmt.Errorf("name is required")
	}
	if payload.Code == "" {
		return currencyPayload{}, fmt.Errorf("code is required")
	}

	return payload, nil
}

func parseIDFromPath(path string, prefix string) (int64, error) {
	trimmed := strings.TrimPrefix(path, prefix)
	if trimmed == path || strings.Contains(trimmed, "/") {
		return 0, errors.New("invalid path")
	}

	id, err := strconv.ParseInt(trimmed, 10, 64)
	if err != nil || id <= 0 {
		return 0, errors.New("invalid id")
	}

	return id, nil
}

func methodNotAllowed(writer http.ResponseWriter, allowedMethods ...string) {
	writer.Header().Set("Allow", strings.Join(allowedMethods, ", "))
	writeError(writer, http.StatusMethodNotAllowed, "method_not_allowed", "method not allowed")
}

func isUniqueConstraintError(err error) bool {
	return strings.Contains(strings.ToLower(err.Error()), "unique constraint failed")
}

func writeJSON(writer http.ResponseWriter, status int, payload any) {
	writer.Header().Set("Content-Type", "application/json")
	writer.WriteHeader(status)
	if err := json.NewEncoder(writer).Encode(payload); err != nil {
		http.Error(writer, "failed to encode response", http.StatusInternalServerError)
	}
}

func writeError(writer http.ResponseWriter, status int, code string, message string) {
	writeJSON(writer, status, apiError{Error: errorBody{Code: code, Message: message}})
}