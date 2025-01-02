package handlers

import (
	"backend/models"
	"backend/repositories"
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
	"github.com/lib/pq"
)

type PhoneHandler struct {
	Repo *repositories.PhoneRepository
}

func (h *PhoneHandler) AddPhone(w http.ResponseWriter, r *http.Request) {
	var phone models.Phone
	if err := json.NewDecoder(r.Body).Decode(&phone); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	// Call the stored procedure to add a phone number
	_, err := h.Repo.DB.Exec("CALL add_phone_number($1, $2, $3,$4)", phone.PhoneNumber, phone.Notes, phone.Status, "admin_user")
	if err != nil {
		// Check if the error is related to the phone number already existing
		if pqErr, ok := err.(*pq.Error); ok {
			if pqErr.Code == "P0001" {
				if pqErr.Message == "Phone number already exists" {
					http.Error(w, "Phone number already exists", http.StatusConflict)
					return
				}
			}
		}

		http.Error(w, "Failed to add phone", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
}

func (h *PhoneHandler) UpdatePhone(w http.ResponseWriter, r *http.Request) {
	var phone models.Phone
	if err := json.NewDecoder(r.Body).Decode(&phone); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	if err := h.Repo.UpdatePhone(phone); err != nil {
		http.Error(w, "Failed to update phone", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (h *PhoneHandler) DeletePhone(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(mux.Vars(r)["id"])

	if err := h.Repo.DeletePhone(id); err != nil {
		http.Error(w, "Failed to delete phone", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (h *PhoneHandler) GetAllPhones(w http.ResponseWriter, r *http.Request) {
	phones, err := h.Repo.GetAllPhones()
	if err != nil {
		http.Error(w, "Failed to get phones", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(phones)
}
