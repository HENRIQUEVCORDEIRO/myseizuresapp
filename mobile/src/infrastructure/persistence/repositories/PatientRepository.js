import { Patient } from '../../../domain/entities/index.js';
import { SQLiteRepository } from './SQLiteRepository.js';

function requirePositiveInteger(value, field) {
  if (!Number.isInteger(value) || value < 1) {
    throw new TypeError(`${field} must be a positive integer.`);
  }
  return value;
}

export class PatientRepository extends SQLiteRepository {
  async findPatientById(patientId) {
    const row = await this.getFirst(
      `SELECT id, user_id, birth_date, diagnosis_date
       FROM patients
       WHERE id = $patientId;`,
      { $patientId: requirePositiveInteger(patientId, 'patientId') },
    );
    return row
      ? new Patient({
          id: row.id,
          userId: row.user_id,
          birthDate: row.birth_date,
          diagnosisDate: row.diagnosis_date,
        })
      : null;
  }
}
