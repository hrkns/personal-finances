package backend

import (
	"database/sql"
	"net/http"
	"strings"
)

type app struct {
	db *sql.DB
}

func NewMux(db *sql.DB) *http.ServeMux {
	application := app{db: db}
	return application.routes()
}

func isUniqueConstraintError(err error) bool {
	return strings.Contains(strings.ToLower(err.Error()), "unique constraint failed")
}

func isForeignKeyConstraintError(err error) bool {
	return strings.Contains(strings.ToLower(err.Error()), "foreign key constraint failed")
}
