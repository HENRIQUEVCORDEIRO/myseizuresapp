function requireMethod(adapter, method, name) {
  if (typeof adapter?.[method] !== 'function') {
    throw new TypeError(`${name} must implement ${method}().`);
  }
  return adapter;
}

export function reportingContext({
  seizureRepository,
  triggerRepository,
  treatmentRepository,
  authorizePatientAccess,
  getActivePatientId,
}) {
  if (getActivePatientId !== undefined && typeof getActivePatientId !== 'function') {
    throw new TypeError('Active patient resolver must be a function.');
  }
  if (
    authorizePatientAccess !== undefined &&
    typeof authorizePatientAccess?.execute !== 'function'
  ) {
    throw new TypeError('Patient authorization use case must implement execute().');
  }
  return {
    seizureRepository: requireMethod(
      seizureRepository,
      'listSeizuresByPeriod',
      'Seizure repository',
    ),
    triggerRepository: requireMethod(
      triggerRepository,
      'listTriggersByPeriod',
      'Trigger repository',
    ),
    treatmentRepository: requireMethod(
      treatmentRepository,
      'listAdherenceByPeriod',
      'Treatment repository',
    ),
    authorizePatientAccess,
    getActivePatientId,
  };
}

export function requirePatientId(value) {
  if (!Number.isInteger(value) || value < 1) {
    throw new TypeError('patientId must be a positive integer.');
  }
  return value;
}
