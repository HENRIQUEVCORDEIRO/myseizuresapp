import { Adherence, Reminder, Treatment } from '../../../domain/entities/index.js';
import { ReminderStatus } from '../../../domain/value-objects/enums.js';
import { requireTimestamp } from '../../../domain/value-objects/validation.js';
import { generateReminderSchedule } from '../../../domain/rules/treatmentRules.js';
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

function requireAdherence(value) {
  if (!(value instanceof Adherence)) {
    throw new TypeError('Treatment repository requires an Adherence confirmation.');
  }

  return value;
}

function requirePeriod(period) {
  const periodStart = requireTimestamp(period?.periodStart, 'periodStart');
  const periodEnd = requireTimestamp(period?.periodEnd, 'periodEnd');

  if (periodStart > periodEnd) {
    throw new RangeError('Adherence periodStart must not be after periodEnd.');
  }

  return { periodStart, periodEnd };
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

function toTreatment(row, baseTimes) {
  return new Treatment({
    id: row.id,
    patientId: row.patient_id,
    type: row.type,
    name: row.name,
    dailyFrequency: row.daily_frequency,
    baseTimes,
    active: Boolean(row.active),
  });
}

function toReminder(row) {
  return new Reminder({
    id: row.id,
    treatmentId: row.treatment_id,
    scheduledAt: row.scheduled_at,
    status: row.status,
  });
}

function toAdherence(row) {
  return new Adherence({
    id: row.id,
    reminderId: row.reminder_id,
    confirmedAt: row.confirmed_at,
    consumptionStatus: row.consumption_status,
  });
}

export class FinalConfirmationError extends Error {
  constructor(message = 'Reminder already has a different final confirmation.') {
    super(message);
    this.name = 'FinalConfirmationError';
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

  async saveTreatmentWithReminders(value, { from, days = 7 } = {}) {
    const treatment = requireTreatment(value);
    const boundary = requireTimestamp(from, 'from');
    const timestamp = requireTimestamp(this.now(), 'now');

    return this.withTransaction(async (database) => {
      let treatmentId = treatment.id;
      if (treatmentId === null) {
        const result = await database.runAsync(
          `INSERT INTO treatments
             (patient_id, type, name, daily_frequency, active, created_at, updated_at)
           VALUES ($patientId, $type, $name, $dailyFrequency, $active, $createdAt, $updatedAt);`,
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
          `UPDATE treatments SET type = $type, name = $name,
             daily_frequency = $dailyFrequency, active = $active, updated_at = $updatedAt
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
        if (result.changes === 0) throw new Error('Treatment was not found for this patient.');
        await database.runAsync('DELETE FROM treatment_times WHERE treatment_id = $treatmentId;', {
          $treatmentId: treatmentId,
        });
      }

      await insertTreatmentTimes(database, treatmentId, treatment.baseTimes);
      const savedTreatment = new Treatment({
        ...treatment,
        id: treatmentId,
        dailyFrequency: treatment.dailyFrequency.value,
      });
      const generated = generateReminderSchedule({
        treatment: savedTreatment,
        from: boundary,
        days,
      });
      await database.runAsync(
        `DELETE FROM reminders WHERE treatment_id = $treatmentId
         AND scheduled_at >= $from AND status = 'SCHEDULED';`,
        { $treatmentId: treatmentId, $from: boundary },
      );
      const reminders = [];
      for (const reminder of generated) {
        const result = await database.runAsync(
          `INSERT INTO reminders (treatment_id, scheduled_at, status)
           VALUES ($treatmentId, $scheduledAt, 'SCHEDULED');`,
          { $treatmentId: treatmentId, $scheduledAt: reminder.scheduledAt },
        );
        reminders.push(new Reminder({ ...reminder, id: Number(result.lastInsertRowId) }));
      }
      return Object.freeze({ treatment: savedTreatment, reminders: Object.freeze(reminders) });
    });
  }

  async findTreatmentById(patientId, treatmentId) {
    const safeTreatmentId = requirePositiveInteger(treatmentId, 'treatmentId');
    const row = await this.getFirstForPatient(
      patientId,
      `SELECT id, patient_id, type, name, daily_frequency, active
       FROM treatments
       WHERE id = $treatmentId AND patient_id = $patientId;`,
      { $treatmentId: safeTreatmentId },
    );

    if (!row) {
      return null;
    }

    const times = await this.getAllForPatient(
      patientId,
      `SELECT tt.scheduled_time
       FROM treatment_times tt
       INNER JOIN treatments t ON t.id = tt.treatment_id
       WHERE tt.treatment_id = $treatmentId AND t.patient_id = $patientId
       ORDER BY tt.scheduled_time ASC;`,
      { $treatmentId: safeTreatmentId },
    );

    return toTreatment(
      row,
      times.map((item) => item.scheduled_time),
    );
  }

  async listTreatmentsByPatient(patientId, { active } = {}) {
    if (active !== undefined && typeof active !== 'boolean') {
      throw new TypeError('Treatment active filter must be a boolean.');
    }

    const rows = await this.getAllForPatient(
      patientId,
      `SELECT id, patient_id, type, name, daily_frequency, active
       FROM treatments
       WHERE patient_id = $patientId
         AND ($active IS NULL OR active = $active)
       ORDER BY active DESC, name COLLATE NOCASE ASC, id ASC;`,
      { $active: active === undefined ? null : active ? 1 : 0 },
    );

    return Promise.all(rows.map((row) => this.findTreatmentById(patientId, row.id)));
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

  async findReminderById(patientId, reminderId) {
    const safeReminderId = requirePositiveInteger(reminderId, 'reminderId');
    const row = await this.getFirstForPatient(
      patientId,
      `SELECT r.id, r.treatment_id, r.scheduled_at, r.status
       FROM reminders r
       INNER JOIN treatments t ON t.id = r.treatment_id
       WHERE r.id = $reminderId AND t.patient_id = $patientId;`,
      { $reminderId: safeReminderId },
    );

    return row ? toReminder(row) : null;
  }

  async listActionableReminders(patientId, { through } = {}) {
    const boundary = through === undefined ? null : requireTimestamp(through, 'through');
    const rows = await this.getAllForPatient(
      patientId,
      `SELECT r.id, r.treatment_id, r.scheduled_at, r.status
       FROM reminders r INNER JOIN treatments t ON t.id = r.treatment_id
       WHERE t.patient_id = $patientId AND r.status = 'SCHEDULED'
         AND ($through IS NULL OR r.scheduled_at <= $through)
       ORDER BY r.scheduled_at ASC, r.id ASC;`,
      { $through: boundary },
    );
    return rows.map(toReminder);
  }

  async saveAdherence(patientId, value) {
    const safePatientId = requirePositiveInteger(patientId, 'patientId');
    const adherence = requireAdherence(value);

    return this.withTransaction(async (database) => {
      const reminderRow = await database.getFirstAsync(
        `SELECT r.id, r.treatment_id, r.scheduled_at, r.status
         FROM reminders r
         INNER JOIN treatments t ON t.id = r.treatment_id
         WHERE r.id = $reminderId AND t.patient_id = $patientId;`,
        { $reminderId: adherence.reminderId, $patientId: safePatientId },
      );

      if (!reminderRow) {
        throw new Error('Reminder was not found for this patient.');
      }

      const existingRow = await database.getFirstAsync(
        `SELECT id, reminder_id, confirmed_at, consumption_status
         FROM adherence
         WHERE reminder_id = $reminderId;`,
        { $reminderId: adherence.reminderId },
      );

      if (existingRow) {
        if (
          existingRow.consumption_status !== adherence.consumptionStatus ||
          reminderRow.status !== adherence.consumptionStatus
        ) {
          throw new FinalConfirmationError();
        }

        return toAdherence(existingRow);
      }

      if (reminderRow.status !== ReminderStatus.SCHEDULED) {
        throw new FinalConfirmationError('Reminder status is already final.');
      }

      const insertResult = await database.runAsync(
        `INSERT INTO adherence (reminder_id, confirmed_at, consumption_status)
         VALUES ($reminderId, $confirmedAt, $consumptionStatus);`,
        {
          $reminderId: adherence.reminderId,
          $confirmedAt: adherence.confirmedAt,
          $consumptionStatus: adherence.consumptionStatus,
        },
      );
      const updateResult = await database.runAsync(
        `UPDATE reminders
         SET status = $status
         WHERE id = $reminderId AND status = 'SCHEDULED';`,
        {
          $status: adherence.consumptionStatus,
          $reminderId: adherence.reminderId,
        },
      );

      if (updateResult.changes !== 1) {
        throw new FinalConfirmationError('Reminder could not transition to a final status.');
      }

      return new Adherence({ ...adherence, id: Number(insertResult.lastInsertRowId) });
    });
  }

  async listAdherenceByPeriod(patientId, period) {
    const { periodStart, periodEnd } = requirePeriod(period);
    const rows = await this.getAllForPatient(
      patientId,
      `SELECT a.id, a.reminder_id, a.confirmed_at, a.consumption_status
       FROM adherence a
       INNER JOIN reminders r ON r.id = a.reminder_id
       INNER JOIN treatments t ON t.id = r.treatment_id
       WHERE t.patient_id = $patientId
         AND a.confirmed_at >= $periodStart
         AND a.confirmed_at <= $periodEnd
       ORDER BY a.confirmed_at ASC, a.id ASC;`,
      { $periodStart: periodStart, $periodEnd: periodEnd },
    );

    return rows.map(toAdherence);
  }
}
