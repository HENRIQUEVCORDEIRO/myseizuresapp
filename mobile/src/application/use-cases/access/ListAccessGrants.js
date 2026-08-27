import { accessContext } from './accessUseCaseSupport.js';

export class ListAccessGrants {
  constructor(options) {
    Object.assign(this, accessContext(options));
  }

  async execute() {
    return this.client.listAccessGrants(this.patientId(), await this.token());
  }
}
