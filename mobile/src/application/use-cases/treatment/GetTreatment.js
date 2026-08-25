import { treatmentContext } from './treatmentUseCaseSupport.js';

export class GetTreatment {
  constructor(options) {
    Object.assign(this, treatmentContext(options));
  }
  execute(treatmentId) {
    return this.treatmentRepository.findTreatmentById(this.getPatientId(), treatmentId);
  }
}
