package router

import (
	"backend/handlers"
	"backend/repositories"
	"net/http"

	"github.com/gorilla/mux"
)

func InitializeRouter(repo *repositories.PhoneRepository) *mux.Router {
	router := mux.NewRouter()
	phoneHandler := &handlers.PhoneHandler{Repo: repo}

	router.HandleFunc("/phones", phoneHandler.GetAllPhones).Methods(http.MethodGet)
	router.HandleFunc("/phones", phoneHandler.AddPhone).Methods(http.MethodPost)
	router.HandleFunc("/phones", phoneHandler.UpdatePhone).Methods(http.MethodPut)
	router.HandleFunc("/phones/{id}", phoneHandler.DeletePhone).Methods(http.MethodPut)

	return router
}
