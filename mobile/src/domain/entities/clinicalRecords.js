import { SeizureOccurrenceType, TriggerCause } from '../value-objects/enums.js';
import {
  optionalEntityId,
  optionalString,
  requireBoolean,
  requireEntityId,
  requireEnum,
  requireInteger,
  requireString,
  requireTimestamp,
} from '../value-objects/validation.js';

export class SeizureRecord {
  constructor({ id, patientId, occurredAt, occurrenceType, feltAura = false, createdAt }) {
    this.id = optionalEntityId(id);
    this.patientId = requireEntityId(patientId, 'patientId');
    this.occurredAt = requireTimestamp(occurredAt, 'occurredAt', { allowFuture: false });
    this.occurrenceType = requireEnum(occurrenceType, SeizureOccurrenceType, 'occurrenceType');
    this.feltAura = requireBoolean(feltAura ?? false, 'feltAura');
    this.createdAt = requireTimestamp(createdAt, 'createdAt', { allowFuture: false });
    Object.freeze(this);
  }
}

export class TriggerRecord {
  constructor({
    id,
    patientId,
    recordedAt,
    commonCause,
    otherDescription,
    sleepQuality,
    mood,
    createdAt,
  }) {
    this.id = optionalEntityId(id);
    this.patientId = requireEntityId(patientId, 'patientId');
    this.recordedAt = requireTimestamp(recordedAt, 'recordedAt', { allowFuture: false });
    this.commonCause = requireEnum(commonCause, TriggerCause, 'commonCause');
    this.otherDescription = optionalString(otherDescription, 'otherDescription');
    this.sleepQuality = requireInteger(sleepQuality, 'sleepQuality');
    this.mood = requireInteger(mood, 'mood');
    this.createdAt = requireTimestamp(createdAt, 'createdAt', { allowFuture: false });

    if (this.commonCause === TriggerCause.OTHER && !this.otherDescription) {
      requireString(this.otherDescription, 'otherDescription');
    }

    Object.freeze(this);
  }
}
