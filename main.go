package main

import (
	"database/sql"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	_ "modernc.org/sqlite"
)

const serverAddress = ":8080"

type app struct {
	db *sql.DB
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

func isUniqueConstraintError(err error) bool {
	return strings.Contains(strings.ToLower(err.Error()), "unique constraint failed")
}

func isForeignKeyConstraintError(err error) bool {
	return strings.Contains(strings.ToLower(err.Error()), "foreign key constraint failed")
}
