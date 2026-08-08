import { ConsumptionStatus, ReminderStatus, TreatmentType } from '../value-objects/enums.js';
import { DailyFrequency } from '../value-objects/DailyFrequency.js';
import {
  optionalEntityId,
  requireBoolean,
  requireClockTime,
  requireEntityId,
  requireEnum,
  requireString,
  requireTimestamp,
} from '../value-objects/validation.js';

function requireBaseTimes(baseTimes) {
  if (!Array.isArray(baseTimes) || baseTimes.length === 0) {
    throw new TypeError('baseTimes must contain at least one scheduled time');
  }

  const normalized = baseTimes.map((time) => requireClockTime(time, 'baseTimes'));

  if (new Set(normalized).size !== normalized.length) {
    throw new TypeError('baseTimes must not contain duplicates');
  }

  return Object.freeze(normalized);
}

export class Treatment {
  constructor({ id, patientId, type, name, dailyFrequency, baseTimes, active = true }) {
    this.id = optionalEntityId(id);
    this.patientId = requireEntityId(patientId, 'patientId');
    this.type = requireEnum(type, TreatmentType, 'type');
    this.name = requireString(name, 'name');
    this.dailyFrequency = new DailyFrequency(dailyFrequency);
    this.baseTimes = requireBaseTimes(baseTimes);
    this.active = requireBoolean(active, 'active');
    Object.freeze(this);
  }
}

export class Reminder {
  constructor({ id, treatmentId, scheduledAt, status = ReminderStatus.SCHEDULED }) {
    this.id = optionalEntityId(id);
    this.treatmentId = requireEntityId(treatmentId, 'treatmentId');
    this.scheduledAt = requireTimestamp(scheduledAt, 'scheduledAt');
    this.status = requireEnum(status, ReminderStatus, 'status');
    Object.freeze(this);
  }
}

export class Adherence {
  constructor({ id, reminderId, confirmedAt, consumptionStatus }) {
    this.id = optionalEntityId(id);
    this.reminderId = requireEntityId(reminderId, 'reminderId');
    this.confirmedAt = requireTimestamp(confirmedAt, 'confirmedAt', { allowFuture: false });
    this.consumptionStatus = requireEnum(consumptionStatus, ConsumptionStatus, 'consumptionStatus');
    Object.freeze(this);
  }
}
