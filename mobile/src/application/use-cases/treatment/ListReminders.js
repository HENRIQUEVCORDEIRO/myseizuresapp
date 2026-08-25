import { treatmentContext } from './treatmentUseCaseSupport.js';

export class ListReminders {
  constructor(options) {
    Object.assign(this, treatmentContext(options));
  }
  execute(filters = {}) {
    return this.treatmentRepository.listActionableReminders(this.getPatientId(), filters);
  }
}
