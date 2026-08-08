export const clinicalMigration = {
  version: 2,
  name: 'clinical_records_and_treatments',
  up: `
    CREATE TABLE seizure_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      occurred_at TEXT NOT NULL,
      occurrence_type TEXT NOT NULL CHECK (length(trim(occurrence_type)) > 0),
      created_at TEXT NOT NULL,
      CONSTRAINT seizure_records_patient_fk
        FOREIGN KEY (patient_id) REFERENCES patients (id)
        ON UPDATE CASCADE ON DELETE CASCADE
    );

    CREATE TABLE trigger_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      recorded_at TEXT NOT NULL,
      common_cause TEXT NOT NULL CHECK (length(trim(common_cause)) > 0),
      other_description TEXT,
      sleep_quality INTEGER NOT NULL,
      mood INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      CONSTRAINT trigger_records_patient_fk
        FOREIGN KEY (patient_id) REFERENCES patients (id)
        ON UPDATE CASCADE ON DELETE CASCADE
    );

    CREATE TABLE treatments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK (length(trim(type)) > 0),
      name TEXT NOT NULL CHECK (length(trim(name)) > 0),
      daily_frequency INTEGER NOT NULL CHECK (daily_frequency >= 1),
      active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      CONSTRAINT treatments_patient_fk
        FOREIGN KEY (patient_id) REFERENCES patients (id)
        ON UPDATE CASCADE ON DELETE CASCADE
    );

    CREATE TABLE treatment_times (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      treatment_id INTEGER NOT NULL,
      scheduled_time TEXT NOT NULL,
      CONSTRAINT treatment_times_treatment_time_unique
        UNIQUE (treatment_id, scheduled_time),
      CONSTRAINT treatment_times_treatment_fk
        FOREIGN KEY (treatment_id) REFERENCES treatments (id)
        ON UPDATE CASCADE ON DELETE CASCADE
    );

    CREATE TABLE reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      treatment_id INTEGER NOT NULL,
      scheduled_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'SCHEDULED'
        CHECK (status IN ('SCHEDULED', 'TAKEN', 'MISSED')),
      CONSTRAINT reminders_treatment_time_unique UNIQUE (treatment_id, scheduled_at),
      CONSTRAINT reminders_treatment_fk
        FOREIGN KEY (treatment_id) REFERENCES treatments (id)
        ON UPDATE CASCADE ON DELETE CASCADE
    );

    CREATE TABLE adherence (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reminder_id INTEGER NOT NULL,
      confirmed_at TEXT NOT NULL,
      consumption_status TEXT NOT NULL CHECK (consumption_status IN ('TAKEN', 'MISSED')),
      CONSTRAINT adherence_reminder_unique UNIQUE (reminder_id),
      CONSTRAINT adherence_reminder_fk
        FOREIGN KEY (reminder_id) REFERENCES reminders (id)
        ON UPDATE CASCADE ON DELETE CASCADE
    );

    CREATE INDEX seizure_records_patient_occurred_at_index
      ON seizure_records (patient_id, occurred_at);
    CREATE INDEX trigger_records_patient_recorded_at_index
      ON trigger_records (patient_id, recorded_at);
    CREATE INDEX treatments_patient_active_index ON treatments (patient_id, active);
    CREATE INDEX treatment_times_treatment_index ON treatment_times (treatment_id);
    CREATE INDEX reminders_treatment_scheduled_at_index
      ON reminders (treatment_id, scheduled_at);
    CREATE INDEX adherence_confirmed_at_index ON adherence (confirmed_at);
  `,
};
