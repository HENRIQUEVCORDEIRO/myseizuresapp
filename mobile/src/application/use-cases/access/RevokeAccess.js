import { accessContext, requirePositiveInteger } from './accessUseCaseSupport.js';

export class RevokeAccess {
  constructor(options) {
    Object.assign(this, accessContext(options));
  }

  async execute({ grantId } = {}) {
    return this.client.revokeAccessGrant(
      this.patientId(),
      requirePositiveInteger(grantId, 'grantId'),
      await this.token(),
    );
  }
}
