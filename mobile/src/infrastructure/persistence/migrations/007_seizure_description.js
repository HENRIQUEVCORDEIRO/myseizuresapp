export const seizureDescriptionMigration = {
  version: 7,
  name: 'seizure_description',
  up: `
    ALTER TABLE seizure_records ADD COLUMN description TEXT;
  `,
};
