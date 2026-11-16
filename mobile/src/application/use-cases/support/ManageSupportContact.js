import { SupportContact } from '../../../domain/entities/index.js';
import {
  requireActivePatientResolver,
  requireAdapterMethod,
  requireClock,
  requireInput,
  resolveActivePatientId,
} from '../clinical/clinicalUseCaseSupport.js';

export class ManageSupportContact {
  constructor({
    supportContactRepository,
    getActivePatientId,
    now = () => new Date().toISOString(),
  }) {
    const repository = requireAdapterMethod(
      supportContactRepository,
      'findContact',
      'supportContactRepository',
    );

    requireAdapterMethod(repository, 'saveContact', 'supportContactRepository');
    requireAdapterMethod(repository, 'clearContact', 'supportContactRepository');
    this.supportContactRepository = repository;
    this.getActivePatientId = requireActivePatientResolver(getActivePatientId);
    this.now = requireClock(now);
  }

  async load(value) {
    const input = requireInput(value ?? {});
    const patientId = await resolveActivePatientId(this.getActivePatientId, input);

    return this.supportContactRepository.findContact(patientId);
  }

  async save(value) {
    const input = requireInput(value);
    const patientId = await resolveActivePatientId(this.getActivePatientId, input);
    const contact = new SupportContact({
      patientId,
      name: input.name,
      relationship: input.relationship,
      phone: input.phone,
      updatedAt: this.now(),
    });

    return this.supportContactRepository.saveContact(patientId, contact);
  }

  async clear(value) {
    const input = requireInput(value ?? {});
    const patientId = await resolveActivePatientId(this.getActivePatientId, input);

    return this.supportContactRepository.clearContact(patientId);
  }
}
