import { TriggerRecord } from '../../../domain/entities/index.js';
import { PatientScopedRepository } from './PatientScopedRepository.js';

const SELECT_COLUMNS = `
  SELECT id, patient_id, recorded_at, common_cause, other_description,
         sleep_quality, mood, created_at
  FROM trigger_records
`;

function requireTrigger(record) {
  if (!(record instanceof TriggerRecord)) {
    throw new TypeError('Trigger repository requires a TriggerRecord.');
  }

  return record;
}

function requireRecordId(recordId) {
  if (!Number.isInteger(recordId) || recordId < 1) {
    throw new TypeError('Trigger record id must be a positive integer.');
  }

  return recordId;
}

function requirePeriod(period) {
  const { periodStart, periodEnd } = period ?? {};
  const start = typeof periodStart === 'string' ? Date.parse(periodStart) : Number.NaN;
  const end = typeof periodEnd === 'string' ? Date.parse(periodEnd) : Number.NaN;

  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    throw new TypeError('Trigger period requires valid periodStart and periodEnd timestamps.');
  }

  if (start > end) {
    throw new RangeError('Trigger periodStart must not be after periodEnd.');
  }

  return { periodStart, periodEnd };
}

function toEntity(row) {
  return new TriggerRecord({
    id: row.id,
    patientId: row.patient_id,
    recordedAt: row.recorded_at,
    commonCause: row.common_cause,
    otherDescription: row.other_description,
    sleepQuality: row.sleep_quality,
    mood: row.mood,
    createdAt: row.created_at,
  });
}

export class TriggerRepository extends PatientScopedRepository {
  async saveTrigger(value) {
    const record = requireTrigger(value);
    const parameters = {
      $recordedAt: record.recordedAt,
      $commonCause: record.commonCause,
      $otherDescription: record.otherDescription,
      $sleepQuality: record.sleepQuality,
      $mood: record.mood,
      $createdAt: record.createdAt,
    };

    if (record.id === null) {
      const result = await this.runForPatient(
        record.patientId,
        `INSERT INTO trigger_records
           (patient_id, recorded_at, common_cause, other_description,
            sleep_quality, mood, created_at)
         VALUES ($patientId, $recordedAt, $commonCause, $otherDescription,
                 $sleepQuality, $mood, $createdAt);`,
        parameters,
      );

      return new TriggerRecord({ ...record, id: Number(result.lastInsertRowId) });
    }

    const result = await this.runForPatient(
      record.patientId,
      `UPDATE trigger_records
       SET recorded_at = $recordedAt,
           common_cause = $commonCause,
           other_description = $otherDescription,
           sleep_quality = $sleepQuality,
           mood = $mood,
           created_at = $createdAt
       WHERE id = $recordId AND patient_id = $patientId;`,
      { ...parameters, $recordId: record.id },
    );

    if (result.changes === 0) {
      throw new Error('Trigger record was not found for this patient.');
    }

    return new TriggerRecord({ ...record });
  }

  async findTriggerById(patientId, recordId) {
    const row = await this.getFirstForPatient(
      patientId,
      `${SELECT_COLUMNS}
       WHERE id = $recordId AND patient_id = $patientId;`,
      { $recordId: requireRecordId(recordId) },
    );

    return row ? toEntity(row) : null;
  }

  async listTriggersByPeriod(patientId, period) {
    const { periodStart, periodEnd } = requirePeriod(period);
    const rows = await this.getAllForPatient(
      patientId,
      `${SELECT_COLUMNS}
       WHERE patient_id = $patientId
         AND recorded_at >= $periodStart
         AND recorded_at <= $periodEnd
       ORDER BY recorded_at ASC, id ASC;`,
      { $periodStart: periodStart, $periodEnd: periodEnd },
    );

    return rows.map(toEntity);
  }

  async deleteTrigger(patientId, recordId) {
    const result = await this.runForPatient(
      patientId,
      `DELETE FROM trigger_records
       WHERE id = $recordId AND patient_id = $patientId;`,
      { $recordId: requireRecordId(recordId) },
    );

    return result.changes > 0;
  }
}
