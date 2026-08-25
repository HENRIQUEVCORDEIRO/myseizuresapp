import { definePort } from './definePort.js';

export const PatientRepositoryPort = definePort('PatientRepositoryPort', ['findPatientById']);

export const ClinicalRecordRepositoryPort = definePort('ClinicalRecordRepositoryPort', [
  'saveSeizure',
  'saveTrigger',
  'listSeizuresByPeriod',
  'listTriggersByPeriod',
  'listChronologicalEvents',
]);

export const TreatmentRepositoryPort = definePort('TreatmentRepositoryPort', [
  'saveTreatment',
  'saveTreatmentWithReminders',
  'findTreatmentById',
  'listTreatmentsByPatient',
  'replaceFutureReminders',
  'findReminderById',
  'listActionableReminders',
  'saveAdherence',
  'listAdherenceByPeriod',
]);

export const AccessGrantRepositoryPort = definePort('AccessGrantRepositoryPort', [
  'listAccessGrants',
  'createAccessGrant',
  'revokeAccessGrant',
  'hasPatientAccess',
]);
