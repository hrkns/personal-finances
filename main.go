package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"personal-finances/backend"
)

const defaultServerPort = "8080"

func main() {
	databasePath := os.Getenv("DATABASE_PATH")
	if strings.TrimSpace(databasePath) == "" {
		databasePath = filepath.Join("data", "personal_finances.db")
	}

	serverPort := strings.TrimSpace(os.Getenv("PORT"))
	if serverPort == "" {
		serverPort = defaultServerPort
	}
	serverAddress := ":" + strings.TrimPrefix(serverPort, ":")

	db, err := backend.SetupDatabase(databasePath)
	if err != nil {
		log.Fatalf("database setup failed: %v", err)
	}
	defer db.Close()

	mux := backend.NewMux(db)

	log.Printf("Server is running on http://localhost%s", serverAddress)
	if err = http.ListenAndServe(serverAddress, mux); err != nil {
		log.Fatalf("server failed: %v", err)
	}
}
