package backend

import (
	"net/http"
)

const countriesPath = "/api/countries"

type country struct {
	Code string `json:"code"`
	Name string `json:"name"`
}

func (application app) registerCountryRoutes(mux *http.ServeMux) {
	mux.HandleFunc(countriesPath, application.countriesHandler)
}

func (application app) countriesHandler(writer http.ResponseWriter, request *http.Request) {
	switch request.Method {
	case http.MethodGet:
		application.listCountries(writer)
	default:
		methodNotAllowed(writer, http.MethodGet)
	}
}

func (application app) listCountries(writer http.ResponseWriter) {
	rows, err := application.db.Query(`SELECT code, name FROM countries ORDER BY code`)
	if err != nil {
		writeError(writer, http.StatusInternalServerError, "internal_error", "failed to load countries")
		return
	}
	defer rows.Close()

	items := make([]country, 0)
	for rows.Next() {
		var item country
		if scanErr := rows.Scan(&item.Code, &item.Name); scanErr != nil {
			writeError(writer, http.StatusInternalServerError, "internal_error", "failed to read countries")
			return
		}
		items = append(items, item)
	}

	writeJSON(writer, http.StatusOK, items)
}
