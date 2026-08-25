import { treatmentContext } from './treatmentUseCaseSupport.js';

export class ListTreatments {
  constructor(options) {
    Object.assign(this, treatmentContext(options));
  }
  execute(filters = {}) {
    return this.treatmentRepository.listTreatmentsByPatient(this.getPatientId(), filters);
  }
}
