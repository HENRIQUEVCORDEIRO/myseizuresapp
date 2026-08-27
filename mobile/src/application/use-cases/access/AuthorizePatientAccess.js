import { accessContext, requirePositiveInteger } from './accessUseCaseSupport.js';

export class AuthorizePatientAccess {
  constructor(options) {
    Object.assign(this, accessContext(options));
  }

  async execute({ patientId } = {}) {
    return this.client.hasPatientAccess(
      requirePositiveInteger(patientId, 'patientId'),
      await this.token(),
    );
  }
}
