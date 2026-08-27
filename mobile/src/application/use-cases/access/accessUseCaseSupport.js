import { AccessGrantRepositoryPort } from '../../ports/index.js';

function requirePositiveInteger(value, field) {
  if (!Number.isInteger(value) || value < 1) {
    throw new TypeError(`${field} must be a positive integer.`);
  }
  return value;
}

export function accessContext({ accessGrantClient, getSessionToken, getActivePatientId }) {
  const client = AccessGrantRepositoryPort.assert(accessGrantClient);
  if (typeof getSessionToken !== 'function') {
    throw new TypeError('Access use cases require a session-token resolver.');
  }
  if (getActivePatientId !== undefined && typeof getActivePatientId !== 'function') {
    throw new TypeError('Active patient resolver must be a function.');
  }
  return {
    client,
    async token() {
      const token = await getSessionToken();
      if (typeof token !== 'string' || !token.trim()) {
        throw new Error('An authenticated session is required.');
      }
      return token.trim();
    },
    patientId() {
      if (!getActivePatientId) throw new Error('An active patient is required.');
      return requirePositiveInteger(getActivePatientId(), 'patientId');
    },
  };
}

export { requirePositiveInteger };
