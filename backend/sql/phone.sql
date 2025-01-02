-- Add a phone number
CREATE OR REPLACE PROCEDURE add_phone_number(
    p_phone_number VARCHAR,
    p_notes TEXT,
    p_status VARCHAR DEFAULT 'active',
    p_created_by VARCHAR DEFAULT 'system'
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check if the phone number already exists
    IF EXISTS (SELECT 1 FROM phone_numbers WHERE phone_number = p_phone_number AND status != 'deleted') THEN
        RAISE EXCEPTION 'Phone number % already exists', p_phone_number;
    END IF;

    -- Insert the new phone number
    INSERT INTO phone_numbers (phone_number, notes, status)
    VALUES (p_phone_number, p_notes, p_status);

    -- Log the action in the history table
    CALL log_phone_number_history(
        p_phone_number, 
        'INSERT', 
        NULL, 
        p_status, 
        p_notes, 
        p_created_by
    );
END;
$$;


-- Update a phone number
CREATE OR REPLACE PROCEDURE update_phone_number(
    p_id INT,
    p_phone_number VARCHAR,
    p_notes TEXT,
    p_status VARCHAR,
    p_modified_by VARCHAR DEFAULT 'system'
)
LANGUAGE plpgsql
AS $$
DECLARE
    old_status VARCHAR;
BEGIN
    -- Get the current status of the phone number
    SELECT status INTO old_status
    FROM phone_numbers
    WHERE id = p_id;

    -- Update the phone number
    UPDATE phone_numbers
    SET phone_number = p_phone_number,
        notes = p_notes,
        status = p_status,
        modified_at = CURRENT_TIMESTAMP
    WHERE id = p_id AND status != 'deleted';

    -- Log the action in the history table
    CALL log_phone_number_history(
        p_phone_number, 
        'UPDATE', 
        old_status, 
        p_status, 
        p_notes, 
        p_modified_by
    );
END;
$$;


--  delete a phone number
CREATE OR REPLACE PROCEDURE delete_phone_number(
    p_id INT,
    p_modified_by VARCHAR DEFAULT 'system'
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_phone_number VARCHAR;
    v_old_status VARCHAR;
BEGIN
    -- Get the current phone number and status
    SELECT pn.phone_number, pn.status INTO v_phone_number, v_old_status
    FROM phone_numbers pn
    WHERE pn.id = p_id;

    -- Ensure the record exists before attempting to delete
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Phone number with ID % does not exist.', p_id;
    END IF;

    -- Delete the phone number
    DELETE FROM phone_numbers
    WHERE id = p_id;

    -- Log the action in the history table
    CALL log_phone_number_history(
        v_phone_number, 
        'DELETE', 
        v_old_status, 
        NULL, 
        NULL, 
        p_modified_by
    );
END;
$$;

-- Get all phone numbers
CREATE OR REPLACE FUNCTION get_phone_numbers()
RETURNS TABLE (
    id INT,
    phone_number VARCHAR,
    status VARCHAR,
    notes TEXT,
    created_at TIMESTAMP,
    modified_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        phone_numbers.id, 
        phone_numbers.phone_number, 
        phone_numbers.status, 
        phone_numbers.notes, 
        phone_numbers.created_at, 
        phone_numbers.modified_at
    FROM phone_numbers
    WHERE phone_numbers.status != 'deleted';
END;
$$ LANGUAGE plpgsql;


CREATE TABLE phone_numbers (
    id SERIAL PRIMARY KEY,
    phone_number VARCHAR(15) NOT NULL UNIQUE,
    status VARCHAR(10) CHECK (status IN ('active', 'blocked', 'deleted')) DEFAULT 'active',
    notes TEXT,
    created_by VARCHAR(50) DEFAULT 'system' ,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    
);

CREATE TABLE phone_number_history (
    id SERIAL PRIMARY KEY,
    phone_number VARCHAR NOT NULL,
    action VARCHAR NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    old_status VARCHAR,      -- Previous status
    new_status VARCHAR,      -- Updated status
    notes TEXT,              
    modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_by VARCHAR      
);
