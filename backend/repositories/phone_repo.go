package repositories

import (
	"backend/models"
	"database/sql"
)

type PhoneRepository struct {
	DB *sql.DB
}

func NewPhoneRepository(db *sql.DB) *PhoneRepository {
	return &PhoneRepository{DB: db}
}

func (repo *PhoneRepository) AddPhone(phone models.Phone) error {
	_, err := repo.DB.Exec("CALL add_phone_number($1, $2, $3, $4)", phone.PhoneNumber, phone.Notes, phone.Status, "admin_user")
	return err
}

func (repo *PhoneRepository) UpdatePhone(phone models.Phone) error {
	_, err := repo.DB.Exec("CALL update_phone_number($1, $2, $3, $4, $5)", phone.ID, phone.PhoneNumber, phone.Notes, phone.Status, "admin_user")
	return err
}

func (repo *PhoneRepository) DeletePhone(id int) error {
	_, err := repo.DB.Exec("CALL delete_phone_number($1, $2)", id, "admin_user")
	return err
}

func (repo *PhoneRepository) GetAllPhones() ([]models.Phone, error) {
	rows, err := repo.DB.Query("SELECT * FROM get_phone_numbers()")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var phones []models.Phone
	for rows.Next() {
		var phone models.Phone
		if err := rows.Scan(&phone.ID, &phone.PhoneNumber, &phone.Status, &phone.Notes, &phone.CreatedAt, &phone.ModifiedAt); err != nil {
			return nil, err
		}
		phones = append(phones, phone)
	}
	return phones, nil
}
