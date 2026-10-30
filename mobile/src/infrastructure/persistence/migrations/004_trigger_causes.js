export const triggerCausesMigration = {
  version: 4,
  name: 'trigger_causes',
  up: `
    CREATE TABLE trigger_causes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trigger_id INTEGER NOT NULL,
      cause TEXT NOT NULL CHECK (length(trim(cause)) > 0),
      CONSTRAINT trigger_causes_trigger_cause_unique
        UNIQUE (trigger_id, cause),
      CONSTRAINT trigger_causes_trigger_fk
        FOREIGN KEY (trigger_id) REFERENCES trigger_records (id)
        ON UPDATE CASCADE ON DELETE CASCADE
    );

    CREATE INDEX trigger_causes_trigger_index
      ON trigger_causes (trigger_id);

    INSERT INTO trigger_causes (trigger_id, cause)
    SELECT id, common_cause
    FROM trigger_records;
  `,
};
