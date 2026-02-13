package main

import (
	"encoding/json"
	"log"
	"net/http"
)

const serverAddress = ":8080"

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("/api/health", healthHandler)
	mux.Handle("/", http.FileServer(http.Dir("web")))

	log.Printf("Server is running on http://localhost%s", serverAddress)
	if err := http.ListenAndServe(serverAddress, mux); err != nil {
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