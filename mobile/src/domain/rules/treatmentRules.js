import { Adherence, Reminder, Treatment } from '../entities/treatment.js';
import { ConsumptionStatus, ReminderStatus } from '../value-objects/enums.js';
import {
  DomainValidationError,
  requireEnum,
  requireInteger,
  requireTimestamp,
} from '../value-objects/validation.js';

function requireTreatment(value) {
  if (!(value instanceof Treatment)) {
    throw new DomainValidationError('treatment', 'must be a Treatment');
  }

  if (value.id === null) {
    throw new DomainValidationError('treatment.id', 'must identify a persisted treatment');
  }

  return value;
}

function requireReminder(value) {
  if (!(value instanceof Reminder)) {
    throw new DomainValidationError('reminder', 'must be a Reminder');
  }

  if (value.id === null) {
    throw new DomainValidationError('reminder.id', 'must identify a persisted reminder');
  }

  return value;
}

function requireAdherence(value, field = 'existingAdherence') {
  if (!(value instanceof Adherence)) {
    throw new DomainValidationError(field, 'must be an Adherence confirmation');
  }

  return value;
}

function startOfUtcDay(timestamp) {
  const date = new Date(timestamp);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

function scheduledTimestamp(day, baseTime) {
  const [hours, minutes] = baseTime.split(':').map(Number);
  const scheduledAt = new Date(day);
  scheduledAt.setUTCHours(hours, minutes, 0, 0);
  return scheduledAt.toISOString();
}

export function generateReminderSchedule({ treatment, from, days = 1 }) {
  const validTreatment = requireTreatment(treatment);
  const fromTimestamp = requireTimestamp(from, 'from');
  const numberOfDays = requireInteger(days, 'days', { min: 1 });

  if (!validTreatment.active) {
    return Object.freeze([]);
  }

  const firstDay = startOfUtcDay(fromTimestamp);
  const reminders = [];

  for (let dayOffset = 0; dayOffset < numberOfDays; dayOffset += 1) {
    const day = new Date(firstDay);
    day.setUTCDate(firstDay.getUTCDate() + dayOffset);

    for (const baseTime of validTreatment.baseTimes) {
      const scheduledAt = scheduledTimestamp(day, baseTime);

      if (scheduledAt >= fromTimestamp) {
        reminders.push(
          new Reminder({
            treatmentId: validTreatment.id,
            scheduledAt,
          }),
        );
      }
    }
  }

  reminders.sort((left, right) => left.scheduledAt.localeCompare(right.scheduledAt));
  return Object.freeze(reminders);
}

export function confirmReminder({
  reminder,
  consumptionStatus,
  confirmedAt,
  existingAdherence = null,
}) {
  const validReminder = requireReminder(reminder);
  const finalStatus = requireEnum(consumptionStatus, ConsumptionStatus, 'consumptionStatus');

  if (existingAdherence !== null) {
    const confirmation = requireAdherence(existingAdherence);

    if (confirmation.reminderId !== validReminder.id) {
      throw new DomainValidationError(
        'existingAdherence.reminderId',
        'must belong to the reminder being confirmed',
      );
    }

    if (confirmation.consumptionStatus !== finalStatus) {
      throw new DomainValidationError(
        'consumptionStatus',
        'cannot replace a final reminder confirmation',
      );
    }

    return Object.freeze({ reminder: validReminder, adherence: confirmation, created: false });
  }

  if (validReminder.status !== ReminderStatus.SCHEDULED) {
    throw new DomainValidationError('reminder.status', 'is already final');
  }

  const adherence = new Adherence({
    reminderId: validReminder.id,
    confirmedAt,
    consumptionStatus: finalStatus,
  });
  const confirmedReminder = new Reminder({
    id: validReminder.id,
    treatmentId: validReminder.treatmentId,
    scheduledAt: validReminder.scheduledAt,
    status: finalStatus,
  });

  return Object.freeze({ reminder: confirmedReminder, adherence, created: true });
}

export function calculateAdherenceRate(confirmations) {
  if (!Array.isArray(confirmations)) {
    throw new DomainValidationError('confirmations', 'must be an array');
  }

  if (confirmations.length === 0) {
    return undefined;
  }

  const reminderIds = new Set();
  let taken = 0;

  for (const item of confirmations) {
    const confirmation = requireAdherence(item, 'confirmations');

    if (reminderIds.has(confirmation.reminderId)) {
      throw new DomainValidationError(
        'confirmations',
        'must contain at most one final confirmation per reminder',
      );
    }

    reminderIds.add(confirmation.reminderId);
    if (confirmation.consumptionStatus === ConsumptionStatus.TAKEN) {
      taken += 1;
    }
  }

  return (taken / confirmations.length) * 100;
}
