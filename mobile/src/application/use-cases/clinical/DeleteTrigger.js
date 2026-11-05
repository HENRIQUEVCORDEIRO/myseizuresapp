import {
  requireActivePatientResolver,
  requireAdapterMethod,
  requireInput,
  resolveActivePatientId,
} from './clinicalUseCaseSupport.js';

function requireRecordId(value) {
  if (!Number.isInteger(value) || value < 1) {
    throw new TypeError('Trigger record id must be a positive integer.');
  }

  return value;
}

export class DeleteTrigger {
  constructor({ triggerRepository, getActivePatientId }) {
    this.triggerRepository = requireAdapterMethod(
      triggerRepository,
      'deleteTrigger',
      'triggerRepository',
    );
    this.getActivePatientId = requireActivePatientResolver(getActivePatientId);
  }

  async execute(value) {
    const input = requireInput(value);
    const patientId = await resolveActivePatientId(this.getActivePatientId, input);

    return this.triggerRepository.deleteTrigger(patientId, requireRecordId(input.recordId));
  }
}
