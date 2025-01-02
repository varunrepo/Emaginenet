package models

import "time"

type Phone struct {
	ID          int       `json:"id"`
	PhoneNumber string    `json:"phone_number"`
	Status      string    `json:"status"`
	Notes       string    `json:"notes"`
	CreatedAt   time.Time `json:"created_at"`
	ModifiedAt  time.Time `json:"modified_at"`
}
