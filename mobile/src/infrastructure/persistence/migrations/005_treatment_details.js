export const treatmentDetailsMigration = {
  version: 5,
  name: 'treatment_details',
  up: `
    ALTER TABLE treatments ADD COLUMN reason TEXT;
    ALTER TABLE treatments ADD COLUMN dose_amount TEXT;
    ALTER TABLE treatments ADD COLUMN start_date TEXT;
    ALTER TABLE treatments ADD COLUMN end_date TEXT;
  `,
};
