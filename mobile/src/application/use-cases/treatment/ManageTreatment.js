import { Treatment } from '../../../domain/entities/index.js';
import { treatmentContext } from './treatmentUseCaseSupport.js';

export class ManageTreatment {
  constructor(options) {
    Object.assign(this, treatmentContext(options));
    this.now = options.now ?? (() => new Date().toISOString());
    this.scheduleDays = options.scheduleDays ?? 7;
    this.notifications = options.notifications;
  }
  async execute(input) {
    const treatment = new Treatment({ ...input, patientId: this.getPatientId() });
    const saved = await this.treatmentRepository.saveTreatmentWithReminders(treatment, {
      from: this.now(),
      days: this.scheduleDays,
    });
    const delivery = this.notifications
      ? await this.notifications.deliverMedicationReminders({
          treatmentName: saved.treatment.name,
          reminders: saved.reminders,
        })
      : Object.freeze({
          permissionStatus: 'unavailable',
          scheduled: Object.freeze([]),
          inApp: saved.reminders,
        });
    return Object.freeze({ ...saved, delivery });
  }
}
