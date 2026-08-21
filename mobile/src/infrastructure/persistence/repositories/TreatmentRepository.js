import { Reminder, Treatment } from '../../../domain/entities/index.js';
import { ReminderStatus } from '../../../domain/value-objects/enums.js';
import { requireTimestamp } from '../../../domain/value-objects/validation.js';
import { PatientScopedRepository } from './PatientScopedRepository.js';

function requirePositiveInteger(value, field) {
  if (!Number.isInteger(value) || value < 1) {
    throw new TypeError(`${field} must be a positive integer.`);
  }

  return value;
}

function requireTreatment(value) {
  if (!(value instanceof Treatment)) {
    throw new TypeError('Treatment repository requires a Treatment.');
  }

  return value;
}

function requireReminderReplacement(reminders, treatmentId, from) {
  if (!Array.isArray(reminders)) {
    throw new TypeError('Reminder replacements must be an array.');
  }

  return reminders.map((reminder) => {
    if (!(reminder instanceof Reminder)) {
      throw new TypeError('Reminder replacements must contain Reminder entities.');
    }

    if (reminder.treatmentId !== treatmentId) {
      throw new TypeError('Replacement reminder must belong to the selected treatment.');
    }

    if (reminder.status !== ReminderStatus.SCHEDULED) {
      throw new TypeError('Replacement reminder must have SCHEDULED status.');
    }

    if (reminder.scheduledAt < from) {
      throw new RangeError('Replacement reminder must not precede the replacement boundary.');
    }

    return reminder;
  });
}

async function insertTreatmentTimes(database, treatmentId, baseTimes) {
  for (const scheduledTime of baseTimes) {
    await database.runAsync(
      `INSERT INTO treatment_times (treatment_id, scheduled_time)
       VALUES ($treatmentId, $scheduledTime);`,
      { $treatmentId: treatmentId, $scheduledTime: scheduledTime },
    );
  }
}

export class TreatmentRepository extends PatientScopedRepository {
  constructor({ now = () => new Date().toISOString(), ...options } = {}) {
    super(options);

    if (typeof now !== 'function') {
      throw new TypeError('Treatment repository clock must be a function.');
    }

    this.now = now;
  }

  async saveTreatment(value) {
    const treatment = requireTreatment(value);
    const timestamp = requireTimestamp(this.now(), 'now');

    return this.withTransaction(async (database) => {
      let treatmentId = treatment.id;

      if (treatmentId === null) {
        const result = await database.runAsync(
          `INSERT INTO treatments
             (patient_id, type, name, daily_frequency, active, created_at, updated_at)
           VALUES
             ($patientId, $type, $name, $dailyFrequency, $active, $createdAt, $updatedAt);`,
          {
            $patientId: treatment.patientId,
            $type: treatment.type,
            $name: treatment.name,
            $dailyFrequency: treatment.dailyFrequency.value,
            $active: treatment.active ? 1 : 0,
            $createdAt: timestamp,
            $updatedAt: timestamp,
          },
        );
        treatmentId = Number(result.lastInsertRowId);
      } else {
        const result = await database.runAsync(
          `UPDATE treatments
           SET type = $type,
               name = $name,
               daily_frequency = $dailyFrequency,
               active = $active,
               updated_at = $updatedAt
           WHERE id = $treatmentId AND patient_id = $patientId;`,
          {
            $treatmentId: treatmentId,
            $patientId: treatment.patientId,
            $type: treatment.type,
            $name: treatment.name,
            $dailyFrequency: treatment.dailyFrequency.value,
            $active: treatment.active ? 1 : 0,
            $updatedAt: timestamp,
          },
        );

        if (result.changes === 0) {
          throw new Error('Treatment was not found for this patient.');
        }

        await database.runAsync('DELETE FROM treatment_times WHERE treatment_id = $treatmentId;', {
          $treatmentId: treatmentId,
        });
      }

      await insertTreatmentTimes(database, treatmentId, treatment.baseTimes);
      return new Treatment({
        ...treatment,
        id: treatmentId,
        dailyFrequency: treatment.dailyFrequency.value,
      });
    });
  }

  async replaceFutureReminders(patientId, treatmentId, from, values) {
    const safePatientId = requirePositiveInteger(patientId, 'patientId');
    const safeTreatmentId = requirePositiveInteger(treatmentId, 'treatmentId');
    const boundary = requireTimestamp(from, 'from');
    const reminders = requireReminderReplacement(values, safeTreatmentId, boundary);

    return this.withTransaction(async (database) => {
      const ownedTreatment = await database.getFirstAsync(
        `SELECT id
         FROM treatments
         WHERE id = $treatmentId AND patient_id = $patientId;`,
        { $treatmentId: safeTreatmentId, $patientId: safePatientId },
      );

      if (!ownedTreatment) {
        throw new Error('Treatment was not found for this patient.');
      }

      await database.runAsync(
        `DELETE FROM reminders
         WHERE treatment_id = $treatmentId
           AND scheduled_at >= $from
           AND status = 'SCHEDULED';`,
        { $treatmentId: safeTreatmentId, $from: boundary },
      );

      const saved = [];

      for (const reminder of reminders) {
        const result = await database.runAsync(
          `INSERT INTO reminders (treatment_id, scheduled_at, status)
           VALUES ($treatmentId, $scheduledAt, 'SCHEDULED');`,
          {
            $treatmentId: safeTreatmentId,
            $scheduledAt: reminder.scheduledAt,
          },
        );
        saved.push(new Reminder({ ...reminder, id: Number(result.lastInsertRowId) }));
      }

      return Object.freeze(saved);
    });
  }
}
