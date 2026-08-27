function requirePositiveInteger(value, field) {
  if (!Number.isInteger(value) || value < 1) {
    throw new TypeError(`${field} must be a positive integer.`);
  }
  return value;
}

function cloneGrant(grant) {
  return Object.freeze({ ...grant });
}

export class AccessGrantRepository {
  constructor({ medicCaretakerIds = [1] } = {}) {
    if (
      !Array.isArray(medicCaretakerIds) ||
      medicCaretakerIds.some((id) => !Number.isInteger(id) || id < 1)
    ) {
      throw new TypeError('Medic/caretaker identifiers must be positive integers.');
    }
    this.medicCaretakerIds = new Set(medicCaretakerIds);
    this.grants = [];
    this.nextId = 1;
  }

  listByPatient(patientId) {
    const id = requirePositiveInteger(patientId, 'patientId');
    return this.grants.filter((grant) => grant.patientId === id).map(cloneGrant);
  }

  findActive(patientId, medicCaretakerId) {
    const patient = requirePositiveInteger(patientId, 'patientId');
    const professional = requirePositiveInteger(medicCaretakerId, 'medicCaretakerId');
    const grant = this.grants.find(
      (item) =>
        item.patientId === patient &&
        item.medicCaretakerId === professional &&
        item.revokedAt === null,
    );
    return grant ? cloneGrant(grant) : null;
  }

  findActiveById(patientId, grantId) {
    const patient = requirePositiveInteger(patientId, 'patientId');
    const id = requirePositiveInteger(grantId, 'grantId');
    const grant = this.grants.find(
      (item) => item.id === id && item.patientId === patient && item.revokedAt === null,
    );
    return grant ? cloneGrant(grant) : null;
  }

  medicCaretakerExists(medicCaretakerId) {
    return this.medicCaretakerIds.has(requirePositiveInteger(medicCaretakerId, 'medicCaretakerId'));
  }

  create({ patientId, medicCaretakerId, grantedAt }) {
    const grant = {
      id: this.nextId,
      patientId: requirePositiveInteger(patientId, 'patientId'),
      medicCaretakerId: requirePositiveInteger(medicCaretakerId, 'medicCaretakerId'),
      grantedAt,
      revokedAt: null,
    };
    this.nextId += 1;
    this.grants.push(grant);
    return cloneGrant(grant);
  }

  revoke(patientId, grantId, revokedAt) {
    const patient = requirePositiveInteger(patientId, 'patientId');
    const id = requirePositiveInteger(grantId, 'grantId');
    const grant = this.grants.find(
      (item) => item.id === id && item.patientId === patient && item.revokedAt === null,
    );
    if (!grant) return null;
    grant.revokedAt = revokedAt;
    return cloneGrant(grant);
  }
}
