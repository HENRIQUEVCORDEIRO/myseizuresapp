import { Adherence } from '../../../domain/entities/index.js';
import { treatmentContext } from './treatmentUseCaseSupport.js';

export class ConfirmDose {
  constructor(options) {
    Object.assign(this, treatmentContext(options));
    this.now = options.now ?? (() => new Date().toISOString());
  }
  async execute({ reminderId, consumptionStatus, confirmedAt = this.now() }) {
    const patientId = this.getPatientId();
    const reminder = await this.treatmentRepository.findReminderById(patientId, reminderId);
    if (!reminder) throw new Error('Reminder was not found for this patient.');
    return this.treatmentRepository.saveAdherence(
      patientId,
      new Adherence({ reminderId, confirmedAt, consumptionStatus }),
    );
  }
}
