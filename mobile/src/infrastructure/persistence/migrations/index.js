import { identityMigration } from './001_identity.js';
import { clinicalMigration } from './002_clinical.js';

export const migrations = Object.freeze([identityMigration, clinicalMigration]);
