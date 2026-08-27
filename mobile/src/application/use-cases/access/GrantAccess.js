import { accessContext, requirePositiveInteger } from './accessUseCaseSupport.js';

export class GrantAccess {
  constructor(options) {
    Object.assign(this, accessContext(options));
  }

  async execute({ medicCaretakerId } = {}) {
    return this.client.createAccessGrant(
      this.patientId(),
      requirePositiveInteger(medicCaretakerId, 'medicCaretakerId'),
      await this.token(),
    );
  }
}
