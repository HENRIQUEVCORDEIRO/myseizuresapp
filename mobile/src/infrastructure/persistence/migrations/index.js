import { identityMigration } from './001_identity.js';
import { clinicalMigration } from './002_clinical.js';
import { seizureAuraMigration } from './003_seizure_aura.js';
import { triggerCausesMigration } from './004_trigger_causes.js';
import { treatmentDetailsMigration } from './005_treatment_details.js';

export const migrations = Object.freeze([
  identityMigration,
  clinicalMigration,
  seizureAuraMigration,
  triggerCausesMigration,
  treatmentDetailsMigration,
]);
