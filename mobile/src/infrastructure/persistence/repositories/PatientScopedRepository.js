import { SQLiteRepository } from './SQLiteRepository.js';

export const PATIENT_ID_PARAMETER = '$patientId';

export class PatientScopeError extends TypeError {
  constructor(message) {
    super(message);
    this.name = 'PatientScopeError';
  }
}

function requirePatientId(patientId) {
  if (!Number.isInteger(patientId) || patientId < 1) {
    throw new PatientScopeError('patientId must be a positive integer.');
  }

  return patientId;
}

function requirePatientScopedSql(sql) {
  if (typeof sql !== 'string' || !/\bpatient_id\b/i.test(sql)) {
    throw new PatientScopeError('Patient-scoped SQL must reference the patient_id column.');
  }

  if (!/\$patientId\b/.test(sql)) {
    throw new PatientScopeError(
      `Patient-scoped SQL must bind patient_id with ${PATIENT_ID_PARAMETER}.`,
    );
  }

  return sql;
}

function createPatientParameters(patientId, parameters) {
  const isPlainObject =
    parameters !== null &&
    typeof parameters === 'object' &&
    !Array.isArray(parameters) &&
    (Object.getPrototypeOf(parameters) === Object.prototype ||
      Object.getPrototypeOf(parameters) === null);

  if (!isPlainObject) {
    throw new PatientScopeError('Patient-scoped parameters must be a plain object.');
  }

  return {
    ...parameters,
    [PATIENT_ID_PARAMETER]: requirePatientId(patientId),
  };
}

export class PatientScopedRepository extends SQLiteRepository {
  async runForPatient(patientId, sql, parameters = {}) {
    return this.run(requirePatientScopedSql(sql), createPatientParameters(patientId, parameters));
  }

  async getFirstForPatient(patientId, sql, parameters = {}) {
    return this.getFirst(
      requirePatientScopedSql(sql),
      createPatientParameters(patientId, parameters),
    );
  }

  async getAllForPatient(patientId, sql, parameters = {}) {
    return this.getAll(
      requirePatientScopedSql(sql),
      createPatientParameters(patientId, parameters),
    );
  }
}
