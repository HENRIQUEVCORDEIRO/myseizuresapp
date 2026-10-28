export const seizureAuraMigration = {
  version: 3,
  name: 'seizure_aura',
  up: `
    ALTER TABLE seizure_records
      ADD COLUMN felt_aura INTEGER NOT NULL DEFAULT 0 CHECK (felt_aura IN (0, 1));
  `,
};
