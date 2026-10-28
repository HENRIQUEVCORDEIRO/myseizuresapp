import { identityMigration } from './001_identity.js';
import { clinicalMigration } from './002_clinical.js';
import { seizureAuraMigration } from './003_seizure_aura.js';

export const migrations = Object.freeze([
  identityMigration,
  clinicalMigration,
  seizureAuraMigration,
]);
