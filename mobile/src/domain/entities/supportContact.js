import {
  optionalString,
  requireEntityId,
  requireString,
  requireTimestamp,
} from '../value-objects/validation.js';

export class SupportContact {
  constructor({ patientId, name, relationship = null, phone, updatedAt }) {
    this.patientId = requireEntityId(patientId, 'patientId');
    this.name = requireString(name, 'name');
    this.relationship = optionalString(relationship, 'relationship');
    this.phone = requireString(phone, 'phone');
    this.updatedAt = requireTimestamp(updatedAt, 'updatedAt');
    Object.freeze(this);
  }
}
