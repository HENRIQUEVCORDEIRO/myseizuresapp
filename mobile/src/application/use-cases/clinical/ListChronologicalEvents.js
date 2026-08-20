import {
  requireActivePatientResolver,
  requireAdapterMethod,
  requireInput,
  requirePeriod,
  resolveActivePatientId,
} from './clinicalUseCaseSupport.js';

export const ClinicalEventType = Object.freeze({
  SEIZURE: 'SEIZURE',
  TRIGGER: 'TRIGGER',
});

function requireRecords(records, repositoryName) {
  if (!Array.isArray(records)) {
    throw new TypeError(`${repositoryName} must return an array.`);
  }

  return records;
}

function toEvent(eventType, record, occurredAt) {
  return Object.freeze({ eventType, occurredAt, record });
}

function compareEvents(left, right) {
  return (
    left.occurredAt.localeCompare(right.occurredAt) ||
    left.eventType.localeCompare(right.eventType) ||
    (left.record.id ?? 0) - (right.record.id ?? 0)
  );
}

export class ListChronologicalEvents {
  constructor({ seizureRepository, triggerRepository, getActivePatientId }) {
    this.seizureRepository = requireAdapterMethod(
      seizureRepository,
      'listSeizuresByPeriod',
      'seizureRepository',
    );
    this.triggerRepository = requireAdapterMethod(
      triggerRepository,
      'listTriggersByPeriod',
      'triggerRepository',
    );
    this.getActivePatientId = requireActivePatientResolver(getActivePatientId);
  }

  async execute(value) {
    const input = requireInput(value);
    const patientId = await resolveActivePatientId(this.getActivePatientId, input);
    const period = requirePeriod(input);
    const [seizureResult, triggerResult] = await Promise.all([
      this.seizureRepository.listSeizuresByPeriod(patientId, period),
      this.triggerRepository.listTriggersByPeriod(patientId, period),
    ]);
    const seizures = requireRecords(seizureResult, 'seizureRepository');
    const triggers = requireRecords(triggerResult, 'triggerRepository');

    return [
      ...seizures
        .filter((record) => record.patientId === patientId)
        .map((record) => toEvent(ClinicalEventType.SEIZURE, record, record.occurredAt)),
      ...triggers
        .filter((record) => record.patientId === patientId)
        .map((record) => toEvent(ClinicalEventType.TRIGGER, record, record.recordedAt)),
    ].sort(compareEvents);
  }
}
