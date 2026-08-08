import { UserRole } from '../value-objects/enums.js';
import {
  optionalCalendarDate,
  optionalEntityId,
  optionalTimestamp,
  requireCalendarDate,
  requireEmail,
  requireEntityId,
  requireEnum,
  requireInteger,
  requireString,
  requireTimestamp,
} from '../value-objects/validation.js';

export class User {
  constructor({ id, name, email, passwordHash, role }) {
    this.id = optionalEntityId(id);
    this.name = requireString(name, 'name');
    this.email = requireEmail(email);
    this.passwordHash = requireString(passwordHash, 'passwordHash');
    this.role = requireEnum(role, UserRole, 'role');
    Object.freeze(this);
  }
}

export class Patient {
  constructor({ id, userId, birthDate, diagnosisDate }) {
    this.id = optionalEntityId(id);
    this.userId = requireEntityId(userId, 'userId');
    this.birthDate = requireCalendarDate(birthDate, 'birthDate');
    this.diagnosisDate = optionalCalendarDate(diagnosisDate, 'diagnosisDate');

    if (this.diagnosisDate && this.diagnosisDate < this.birthDate) {
      throw new TypeError('diagnosisDate must not be before birthDate');
    }

    Object.freeze(this);
  }
}

export class MedicCaretaker {
  constructor({ id, userId, professionalRegister, professionalLink }) {
    this.id = optionalEntityId(id);
    this.userId = requireEntityId(userId, 'userId');
    this.professionalRegister = requireInteger(professionalRegister, 'professionalRegister', {
      min: 1,
    });
    this.professionalLink = requireString(professionalLink, 'professionalLink');
    Object.freeze(this);
  }
}

export class AccessGrant {
  constructor({ id, patientId, medicCaretakerId, grantedAt, revokedAt }) {
    this.id = optionalEntityId(id);
    this.patientId = requireEntityId(patientId, 'patientId');
    this.medicCaretakerId = requireEntityId(medicCaretakerId, 'medicCaretakerId');
    this.grantedAt = requireTimestamp(grantedAt, 'grantedAt', { allowFuture: false });
    this.revokedAt = optionalTimestamp(revokedAt, 'revokedAt', { allowFuture: false });

    if (this.revokedAt && this.revokedAt < this.grantedAt) {
      throw new TypeError('revokedAt must not be before grantedAt');
    }

    Object.freeze(this);
  }

  get isActive() {
    return this.revokedAt === null;
  }
}
