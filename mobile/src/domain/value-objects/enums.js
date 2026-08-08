export const UserRole = Object.freeze({
  PATIENT: 'PATIENT',
  MEDIC_CARETAKER: 'MEDIC_CARETAKER',
});

export const SeizureOccurrenceType = Object.freeze({
  FOCAL: 'FOCAL',
  GENERALIZED: 'GENERALIZED',
  UNKNOWN: 'UNKNOWN',
  OTHER: 'OTHER',
});

export const TriggerCause = Object.freeze({
  SLEEP: 'SLEEP',
  STRESS: 'STRESS',
  MEDICATION: 'MEDICATION',
  ALCOHOL: 'ALCOHOL',
  ILLNESS: 'ILLNESS',
  ROUTINE: 'ROUTINE',
  OTHER: 'OTHER',
});

export const TreatmentType = Object.freeze({
  MEDICATION: 'MEDICATION',
  THERAPY: 'THERAPY',
  OTHER: 'OTHER',
});

export const ReminderStatus = Object.freeze({
  SCHEDULED: 'SCHEDULED',
  TAKEN: 'TAKEN',
  MISSED: 'MISSED',
});

export const ConsumptionStatus = Object.freeze({
  TAKEN: 'TAKEN',
  MISSED: 'MISSED',
});

export const ClinicAlertSeverity = Object.freeze({
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
});
