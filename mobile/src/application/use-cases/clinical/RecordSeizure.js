import { SeizureRecord } from '../../../domain/entities/index.js';
import {
  requireActivePatientResolver,
  requireAdapterMethod,
  requireClock,
  requireInput,
  resolveActivePatientId,
} from './clinicalUseCaseSupport.js';

export class RecordSeizure {
  constructor({ seizureRepository, getActivePatientId, now = () => new Date() }) {
    this.seizureRepository = requireAdapterMethod(
      seizureRepository,
      'saveSeizure',
      'seizureRepository',
    );
    this.getActivePatientId = requireActivePatientResolver(getActivePatientId);
    this.now = requireClock(now);
  }

  async execute(value) {
    const input = requireInput(value);
    const patientId = await resolveActivePatientId(this.getActivePatientId, input);
    const record = new SeizureRecord({
      patientId,
      occurredAt: input.occurredAt,
      occurrenceType: input.occurrenceType,
      createdAt: this.now(),
    });

    return this.seizureRepository.saveSeizure(record);
  }
}
