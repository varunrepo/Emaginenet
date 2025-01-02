package main

import (
	"backend/config"
	"backend/repositories"
	router "backend/routers"
	"log"
	"net/http"

	"github.com/gorilla/handlers"
)

func main() {
	// Initialize the database connection
	config.ConnectDB()

	// Set up the repository and router
	repo := repositories.NewPhoneRepository(config.DB)
	r := router.InitializeRouter(repo)

	corsHandler := handlers.CORS(
		handlers.AllowedOrigins([]string{"http://127.0.0.1:5500"}),                   // Allow all origins (or specify specific domains)
		handlers.AllowedMethods([]string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}), // Allow specific HTTP methods
		handlers.AllowedHeaders([]string{"Content-Type", "Authorization"}),           // Allow specific headers
	)

	// Wrap the router with the CORS middleware
	log.Println("Server running on port 8080")
	http.ListenAndServe(":8080", corsHandler(r))
}
