package main

import (
	"database/sql"
	"errors"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

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
