import {
  requireActivePatientResolver,
  requireAdapterMethod,
  requireInput,
  resolveActivePatientId,
} from './clinicalUseCaseSupport.js';

function requireRecordId(value) {
  if (!Number.isInteger(value) || value < 1) {
    throw new TypeError('Seizure record id must be a positive integer.');
  }

  return value;
}

export class DeleteSeizure {
  constructor({ seizureRepository, getActivePatientId }) {
    this.seizureRepository = requireAdapterMethod(
      seizureRepository,
      'deleteSeizure',
      'seizureRepository',
    );
    this.getActivePatientId = requireActivePatientResolver(getActivePatientId);
  }

  async execute(value) {
    const input = requireInput(value);
    const patientId = await resolveActivePatientId(this.getActivePatientId, input);

    return this.seizureRepository.deleteSeizure(patientId, requireRecordId(input.recordId));
  }
}
