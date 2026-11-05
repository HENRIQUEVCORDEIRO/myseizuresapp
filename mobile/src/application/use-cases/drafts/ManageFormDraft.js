import {
  requireActivePatientResolver,
  requireAdapterMethod,
  requireInput,
  resolveActivePatientId,
} from '../clinical/clinicalUseCaseSupport.js';

export const FormDraftType = Object.freeze({
  SEIZURE: 'SEIZURE',
  TRIGGER: 'TRIGGER',
});

function requireFormType(value) {
  if (!Object.values(FormDraftType).includes(value)) {
    throw new TypeError('Form draft type must be SEIZURE or TRIGGER.');
  }

  return value;
}

function requirePayload(value) {
  const isPlainObject =
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);

  if (!isPlainObject) {
    throw new TypeError('Form draft payload must be a plain object.');
  }

  try {
    JSON.stringify(value);
  } catch (error) {
    throw new TypeError('Form draft payload must be JSON serializable.', { cause: error });
  }

  return value;
}

export class ManageFormDraft {
  constructor({ formDraftRepository, getActivePatientId }) {
    const repository = requireAdapterMethod(
      formDraftRepository,
      'findDraft',
      'formDraftRepository',
    );

    requireAdapterMethod(repository, 'saveDraft', 'formDraftRepository');
    requireAdapterMethod(repository, 'clearDraft', 'formDraftRepository');
    this.formDraftRepository = repository;
    this.getActivePatientId = requireActivePatientResolver(getActivePatientId);
  }

  async load(value) {
    const input = requireInput(value);
    const patientId = await resolveActivePatientId(this.getActivePatientId, input);

    return this.formDraftRepository.findDraft(patientId, requireFormType(input.formType));
  }

  async save(value) {
    const input = requireInput(value);
    const patientId = await resolveActivePatientId(this.getActivePatientId, input);

    return this.formDraftRepository.saveDraft(
      patientId,
      requireFormType(input.formType),
      requirePayload(input.payload),
    );
  }

  async clear(value) {
    const input = requireInput(value);
    const patientId = await resolveActivePatientId(this.getActivePatientId, input);

    return this.formDraftRepository.clearDraft(patientId, requireFormType(input.formType));
  }
}
