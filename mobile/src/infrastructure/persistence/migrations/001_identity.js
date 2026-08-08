export const identityMigration = {
  version: 1,
  name: 'identity',
  up: `
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL CHECK (length(trim(name)) > 0),
      email TEXT NOT NULL COLLATE NOCASE,
      password_hash TEXT NOT NULL CHECK (length(password_hash) > 0),
      role TEXT NOT NULL CHECK (role IN ('PATIENT', 'MEDIC_CARETAKER')),
      created_at TEXT NOT NULL,
      CONSTRAINT users_email_unique UNIQUE (email)
    );

    CREATE TABLE patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      birth_date TEXT NOT NULL,
      diagnosis_date TEXT,
      CONSTRAINT patients_user_unique UNIQUE (user_id),
      CONSTRAINT patients_user_fk
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON UPDATE CASCADE ON DELETE CASCADE
    );

    CREATE TABLE medic_caretakers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      professional_register INTEGER NOT NULL,
      professional_link TEXT NOT NULL CHECK (length(trim(professional_link)) > 0),
      CONSTRAINT medic_caretakers_user_unique UNIQUE (user_id),
      CONSTRAINT medic_caretakers_register_unique UNIQUE (professional_register),
      CONSTRAINT medic_caretakers_user_fk
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON UPDATE CASCADE ON DELETE CASCADE
    );

    CREATE TABLE access_grants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      medic_caretaker_id INTEGER NOT NULL,
      granted_at TEXT NOT NULL,
      revoked_at TEXT,
      CONSTRAINT access_grants_dates_valid
        CHECK (revoked_at IS NULL OR revoked_at >= granted_at),
      CONSTRAINT access_grants_patient_fk
        FOREIGN KEY (patient_id) REFERENCES patients (id)
        ON UPDATE CASCADE ON DELETE CASCADE,
      CONSTRAINT access_grants_medic_caretaker_fk
        FOREIGN KEY (medic_caretaker_id) REFERENCES medic_caretakers (id)
        ON UPDATE CASCADE ON DELETE CASCADE
    );

    CREATE UNIQUE INDEX access_grants_active_pair_unique
      ON access_grants (patient_id, medic_caretaker_id)
      WHERE revoked_at IS NULL;

    CREATE INDEX access_grants_patient_index ON access_grants (patient_id);
    CREATE INDEX access_grants_medic_caretaker_index ON access_grants (medic_caretaker_id);
  `,
};
