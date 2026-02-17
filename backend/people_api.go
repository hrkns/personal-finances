package backend

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
)

const (
	peoplePath        = "/api/people"
	peoplePathByID    = "/api/people/"
	personPathPattern = "/api/people/%d"
)

type person struct {
	ID   int64  `json:"id"`
	Name string `json:"name"`
}

type personPayload struct {
	Name string `json:"name"`
}

func (application app) registerPeopleRoutes(mux *http.ServeMux) {
	mux.HandleFunc(peoplePath, application.peopleHandler)
	mux.HandleFunc(peoplePathByID, application.personByIDHandler)
}

func (application app) peopleHandler(writer http.ResponseWriter, request *http.Request) {
	switch request.Method {
	case http.MethodGet:
		application.listPeople(writer)
	case http.MethodPost:
		application.createPerson(writer, request)
	default:
		methodNotAllowed(writer, http.MethodGet, http.MethodPost)
	}
}

func (application app) personByIDHandler(writer http.ResponseWriter, request *http.Request) {
	id, err := parseIDFromPath(request.URL.Path, peoplePathByID)
	if err != nil {
		writeError(writer, http.StatusBadRequest, "invalid_id", "person id must be a positive integer")
		return
	}

	switch request.Method {
	case http.MethodGet:
		application.getPerson(writer, id)
	case http.MethodPut:
		application.updatePerson(writer, request, id)
	case http.MethodDelete:
		application.deletePerson(writer, id)
	default:
		methodNotAllowed(writer, http.MethodGet, http.MethodPut, http.MethodDelete)
	}
}

func (application app) listPeople(writer http.ResponseWriter) {
	rows, err := application.db.Query(`SELECT id, name FROM people ORDER BY id`)
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to load people")
		return
	}
	defer rows.Close()

	items := make([]person, 0)
	for rows.Next() {
		var item person
		if scanErr := rows.Scan(&item.ID, &item.Name); scanErr != nil {
			writeError(writer, http.StatusInternalServerError, "internal_error", "failed to read people")
			return
		}
		items = append(items, item)
	}

	writeJSON(writer, http.StatusOK, items)
}

func (application app) getPerson(writer http.ResponseWriter, id int64) {
	var item person
	err := application.db.QueryRow(`SELECT id, name FROM people WHERE id = ?`, id).Scan(&item.ID, &item.Name)
	if errors.Is(err, sql.ErrNoRows) {
		writeError(writer, http.StatusNotFound, "not_found", "person not found")
		return
	}
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to load person")
		return
	}

	writeJSON(writer, http.StatusOK, item)
}

func (application app) createPerson(writer http.ResponseWriter, request *http.Request) {
	payload, validationErr := decodePersonPayload(request)
	if validationErr != nil {
		writeError(writer, http.StatusBadRequest, "invalid_payload", validationErr.Error())
		return
	}

	result, err := application.db.Exec(`INSERT INTO people(name) VALUES (?)`, payload.Name)
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to create person")
		return
	}

	id, err := result.LastInsertId()
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to read created person id")
		return
	}

	created := person{ID: id, Name: payload.Name}
	writer.Header().Set("Location", fmt.Sprintf(personPathPattern, id))
	writeJSON(writer, http.StatusCreated, created)
}

func (application app) updatePerson(writer http.ResponseWriter, request *http.Request, id int64) {
	payload, validationErr := decodePersonPayload(request)
	if validationErr != nil {
		writeError(writer, http.StatusBadRequest, "invalid_payload", validationErr.Error())
		return
	}

	result, err := application.db.Exec(`UPDATE people SET name = ? WHERE id = ?`, payload.Name, id)
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to update person")
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to read update result")
		return
	}
	if rowsAffected == 0 {
		writeError(writer, http.StatusNotFound, "not_found", "person not found")
		return
	}

	updated := person{ID: id, Name: payload.Name}
	writeJSON(writer, http.StatusOK, updated)
}

func (application app) deletePerson(writer http.ResponseWriter, id int64) {
	result, err := application.db.Exec(`DELETE FROM people WHERE id = ?`, id)
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to delete person")
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to read delete result")
		return
	}
	if rowsAffected == 0 {
		writeError(writer, http.StatusNotFound, "not_found", "person not found")
		return
	}

	writer.WriteHeader(http.StatusNoContent)
}

func decodePersonPayload(request *http.Request) (personPayload, error) {
	defer request.Body.Close()

	var payload personPayload
	if err := json.NewDecoder(request.Body).Decode(&payload); err != nil {
		return personPayload{}, fmt.Errorf("request body must be valid JSON")
	}

	payload.Name = strings.TrimSpace(payload.Name)
	if payload.Name == "" {
		return personPayload{}, fmt.Errorf("name is required")
	}

	return payload, nil
}
