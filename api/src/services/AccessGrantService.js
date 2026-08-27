import { ApiError } from '../middleware/errorHandler.js';
import { UserRole } from './AuthService.js';

function apiError(status, code, message) {
  return new ApiError({ status, code, message });
}

function requirePositiveInteger(value, field) {
  if (!Number.isInteger(value) || value < 1) {
    throw apiError(422, 'VALIDATION_ERROR', `${field} must be a positive integer.`);
  }
  return value;
}

function requireActor(actor) {
  if (!actor || !Number.isInteger(actor.id) || !actor.role) {
    throw apiError(401, 'UNAUTHENTICATED', 'Authentication is required.');
  }
  return actor;
}

export class AccessGrantService {
  constructor({ repository, now = () => new Date().toISOString() }) {
    const methods = [
      'listByPatient',
      'findActive',
      'findActiveById',
      'medicCaretakerExists',
      'create',
      'revoke',
    ];
    if (methods.some((method) => typeof repository?.[method] !== 'function')) {
      throw new TypeError('Access-grant service requires a complete repository.');
    }
    if (typeof now !== 'function') throw new TypeError('Access-grant clock must be a function.');
    this.repository = repository;
    this.now = now;
  }

  requireOwner(patientId, actorValue) {
    const actor = requireActor(actorValue);
    if (actor.role !== UserRole.PATIENT || actor.patientId !== patientId) {
      throw apiError(403, 'FORBIDDEN', 'Access is not permitted.');
    }
    return actor;
  }

  listGrants({ patientId, actor }) {
    const patient = requirePositiveInteger(patientId, 'patientId');
    this.requireOwner(patient, actor);
    return this.repository.listByPatient(patient);
  }

  createGrant({ patientId, medicCaretakerId, actor }) {
    const patient = requirePositiveInteger(patientId, 'patientId');
    const professional = requirePositiveInteger(medicCaretakerId, 'medicCaretakerId');
    this.requireOwner(patient, actor);
    if (!this.repository.medicCaretakerExists(professional)) {
      throw apiError(404, 'NOT_FOUND', 'The requested professional was not found.');
    }
    if (this.repository.findActive(patient, professional)) {
      throw apiError(409, 'CONFLICT', 'An active access grant already exists.');
    }
    return this.repository.create({
      patientId: patient,
      medicCaretakerId: professional,
      grantedAt: this.now(),
    });
  }

  revokeGrant({ patientId, grantId, actor }) {
    const patient = requirePositiveInteger(patientId, 'patientId');
    const id = requirePositiveInteger(grantId, 'grantId');
    this.requireOwner(patient, actor);
    if (!this.repository.findActiveById(patient, id)) {
      throw apiError(404, 'NOT_FOUND', 'Access grant was not found.');
    }
    return this.repository.revoke(patient, id, this.now());
  }

  hasAccess({ patientId, actor: actorValue }) {
    const patient = requirePositiveInteger(patientId, 'patientId');
    const actor = requireActor(actorValue);
    if (actor.role === UserRole.PATIENT) {
      return { allowed: actor.patientId === patient };
    }
    if (actor.role === UserRole.MEDIC_CARETAKER) {
      return { allowed: Boolean(this.repository.findActive(patient, actor.medicCaretakerId)) };
    }
    return { allowed: false };
  }
}
