import { SeizureOccurrenceType, TriggerCause } from '../value-objects/enums.js';
import {
  DomainValidationError,
  optionalEntityId,
  optionalString,
  requireBoolean,
  requireEntityId,
  requireEnum,
  requireInteger,
  requireString,
  requireTimestamp,
} from '../value-objects/validation.js';

function requireTriggerCauses({ causes, commonCause }) {
  if (causes !== undefined && causes !== null && !Array.isArray(causes)) {
    throw new DomainValidationError('causes', 'must be an array');
  }

  const usesLegacyCause = causes === undefined || causes === null;
  const field = usesLegacyCause ? 'commonCause' : 'causes';
  const values = usesLegacyCause
    ? commonCause === undefined || commonCause === null
      ? []
      : [commonCause]
    : causes;

  if (values.length === 0) {
    throw new DomainValidationError(field, 'must contain at least one cause');
  }

  const uniqueCauses = [];
  for (const cause of values) {
    const validCause = requireEnum(cause, TriggerCause, field);
    if (uniqueCauses.includes(validCause)) {
      throw new DomainValidationError(field, 'must not contain duplicate causes');
    }
    uniqueCauses.push(validCause);
  }

  return Object.freeze(uniqueCauses);
}

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
    causes,
    otherDescription,
    sleepQuality,
    mood,
    createdAt,
  }) {
    this.id = optionalEntityId(id);
    this.patientId = requireEntityId(patientId, 'patientId');
    this.recordedAt = requireTimestamp(recordedAt, 'recordedAt', { allowFuture: false });
    this.causes = requireTriggerCauses({ causes, commonCause });
    this.commonCause = this.causes[0];
    this.otherDescription = optionalString(otherDescription, 'otherDescription');
    this.sleepQuality = requireInteger(sleepQuality, 'sleepQuality');
    this.mood = requireInteger(mood, 'mood');
    this.createdAt = requireTimestamp(createdAt, 'createdAt', { allowFuture: false });

    if (this.causes.includes(TriggerCause.OTHER) && !this.otherDescription) {
      requireString(this.otherDescription, 'otherDescription');
    }

    Object.freeze(this);
  }
}
