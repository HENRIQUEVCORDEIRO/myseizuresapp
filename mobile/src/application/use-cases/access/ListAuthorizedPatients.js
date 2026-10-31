import { accessContext } from './accessUseCaseSupport.js';

export class ListAuthorizedPatients {
  constructor(options) {
    Object.assign(this, accessContext(options));
  }

  async execute() {
    return this.client.listAuthorizedPatients(await this.token());
  }
}
