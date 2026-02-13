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
	"strings"

	_ "modernc.org/sqlite"
)

const serverAddress = ":8080"

type app struct {
	db *sql.DB
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
	mux := application.routes()

	log.Printf("Server is running on http://localhost%s", serverAddress)
	if err = http.ListenAndServe(serverAddress, mux); err != nil {
		log.Fatalf("server failed: %v", err)
	}
}

func (application app) routes() *http.ServeMux {
	mux := http.NewServeMux()
	mux.HandleFunc("/api/health", healthHandler)
	application.registerCurrencyRoutes(mux)
	mux.Handle("/", http.FileServer(http.Dir("web")))
	return mux
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