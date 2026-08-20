import { SeizureRecord } from '../../../domain/entities/index.js';
import { PatientScopedRepository } from './PatientScopedRepository.js';

const SELECT_COLUMNS = `
  SELECT id, patient_id, occurred_at, occurrence_type, created_at
  FROM seizure_records
`;

function requireSeizure(record) {
  if (!(record instanceof SeizureRecord)) {
    throw new TypeError('Seizure repository requires a SeizureRecord.');
  }

  return record;
}

function requireRecordId(recordId) {
  if (!Number.isInteger(recordId) || recordId < 1) {
    throw new TypeError('Seizure record id must be a positive integer.');
  }

  return recordId;
}

function requirePeriod(period) {
  const { periodStart, periodEnd } = period ?? {};
  const start = typeof periodStart === 'string' ? Date.parse(periodStart) : Number.NaN;
  const end = typeof periodEnd === 'string' ? Date.parse(periodEnd) : Number.NaN;

  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    throw new TypeError('Seizure period requires valid periodStart and periodEnd timestamps.');
  }

  if (start > end) {
    throw new RangeError('Seizure periodStart must not be after periodEnd.');
  }

  return { periodStart, periodEnd };
}

function toEntity(row) {
  return new SeizureRecord({
    id: row.id,
    patientId: row.patient_id,
    occurredAt: row.occurred_at,
    occurrenceType: row.occurrence_type,
    createdAt: row.created_at,
  });
}

export class SeizureRepository extends PatientScopedRepository {
  async saveSeizure(value) {
    const record = requireSeizure(value);
    const parameters = {
      $occurredAt: record.occurredAt,
      $occurrenceType: record.occurrenceType,
      $createdAt: record.createdAt,
    };

    if (record.id === null) {
      const result = await this.runForPatient(
        record.patientId,
        `INSERT INTO seizure_records
           (patient_id, occurred_at, occurrence_type, created_at)
         VALUES ($patientId, $occurredAt, $occurrenceType, $createdAt);`,
        parameters,
      );

      return new SeizureRecord({ ...record, id: Number(result.lastInsertRowId) });
    }

    const result = await this.runForPatient(
      record.patientId,
      `UPDATE seizure_records
       SET occurred_at = $occurredAt,
           occurrence_type = $occurrenceType,
           created_at = $createdAt
       WHERE id = $recordId AND patient_id = $patientId;`,
      { ...parameters, $recordId: record.id },
    );

    if (result.changes === 0) {
      throw new Error('Seizure record was not found for this patient.');
    }

    return new SeizureRecord({ ...record });
  }

  async findSeizureById(patientId, recordId) {
    const row = await this.getFirstForPatient(
      patientId,
      `${SELECT_COLUMNS}
       WHERE id = $recordId AND patient_id = $patientId;`,
      { $recordId: requireRecordId(recordId) },
    );

    return row ? toEntity(row) : null;
  }

  async listSeizuresByPeriod(patientId, period) {
    const { periodStart, periodEnd } = requirePeriod(period);
    const rows = await this.getAllForPatient(
      patientId,
      `${SELECT_COLUMNS}
       WHERE patient_id = $patientId
         AND occurred_at >= $periodStart
         AND occurred_at <= $periodEnd
       ORDER BY occurred_at ASC, id ASC;`,
      { $periodStart: periodStart, $periodEnd: periodEnd },
    );

    return rows.map(toEntity);
  }

  async deleteSeizure(patientId, recordId) {
    const result = await this.runForPatient(
      patientId,
      `DELETE FROM seizure_records
       WHERE id = $recordId AND patient_id = $patientId;`,
      { $recordId: requireRecordId(recordId) },
    );

    return result.changes > 0;
  }
}
