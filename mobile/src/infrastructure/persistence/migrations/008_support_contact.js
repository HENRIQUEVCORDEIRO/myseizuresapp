export const supportContactMigration = {
  version: 8,
  name: 'support_contact',
  up: `
    CREATE TABLE support_contacts (
      patient_id INTEGER PRIMARY KEY NOT NULL,
      name TEXT NOT NULL CHECK (length(trim(name)) > 0),
      relationship TEXT,
      phone TEXT NOT NULL CHECK (length(trim(phone)) > 0),
      updated_at TEXT NOT NULL,
      CONSTRAINT support_contacts_patient_fk
        FOREIGN KEY (patient_id) REFERENCES patients (id)
        ON UPDATE CASCADE ON DELETE CASCADE
    );
  `,
};
