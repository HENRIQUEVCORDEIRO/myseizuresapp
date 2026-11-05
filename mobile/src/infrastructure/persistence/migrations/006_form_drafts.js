export const formDraftsMigration = {
  version: 6,
  name: 'form_drafts',
  up: `
    CREATE TABLE form_drafts (
      patient_id INTEGER NOT NULL,
      form_type TEXT NOT NULL CHECK (form_type IN ('SEIZURE', 'TRIGGER')),
      payload TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      CONSTRAINT form_drafts_patient_form_unique PRIMARY KEY (patient_id, form_type),
      CONSTRAINT form_drafts_patient_fk
        FOREIGN KEY (patient_id) REFERENCES patients (id)
        ON UPDATE CASCADE ON DELETE CASCADE
    );

    CREATE INDEX form_drafts_patient_index ON form_drafts (patient_id);
  `,
};
