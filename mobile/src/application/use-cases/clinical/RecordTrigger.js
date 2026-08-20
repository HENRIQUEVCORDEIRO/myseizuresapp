import { TriggerRecord } from '../../../domain/entities/index.js';
import {
  requireActivePatientResolver,
  requireAdapterMethod,
  requireClock,
  requireInput,
  resolveActivePatientId,
} from './clinicalUseCaseSupport.js';

export class RecordTrigger {
  constructor({ triggerRepository, getActivePatientId, now = () => new Date() }) {
    this.triggerRepository = requireAdapterMethod(
      triggerRepository,
      'saveTrigger',
      'triggerRepository',
    );
    this.getActivePatientId = requireActivePatientResolver(getActivePatientId);
    this.now = requireClock(now);
  }

  async execute(value) {
    const input = requireInput(value);
    const patientId = await resolveActivePatientId(this.getActivePatientId, input);
    const record = new TriggerRecord({
      patientId,
      recordedAt: input.recordedAt,
      commonCause: input.commonCause,
      otherDescription: input.otherDescription,
      sleepQuality: input.sleepQuality,
      mood: input.mood,
      createdAt: this.now(),
    });

    return this.triggerRepository.saveTrigger(record);
  }
}
