import { AccessGrantRepositoryPort } from '../../application/ports/index.js';
import { RestClient, RestClientError } from './RestClient.js';

const SAFE_MESSAGES = Object.freeze({
  UNAUTHENTICATED: 'Your session has expired. Sign in again.',
  FORBIDDEN: 'Access is not permitted.',
  NOT_FOUND: 'The access relationship was not found.',
  CONFLICT: 'This professional already has active access.',
  VALIDATION_ERROR: 'The sharing information is invalid.',
  NETWORK_ERROR: 'The sharing service is unavailable. Try again.',
  INVALID_RESPONSE: 'The sharing service returned an invalid response.',
});

function requirePositiveInteger(value, field) {
  if (!Number.isInteger(value) || value < 1) {
    throw new TypeError(`${field} must be a positive integer.`);
  }
  return value;
}

function requireToken(value) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new TypeError('Access-grant requests require an authentication token.');
  }
  return value.trim();
}

function requireGrant(value) {
  if (
    !value ||
    !Number.isInteger(value.id) ||
    !Number.isInteger(value.patientId) ||
    !Number.isInteger(value.medicCaretakerId) ||
    typeof value.grantedAt !== 'string' ||
    (value.revokedAt !== null && typeof value.revokedAt !== 'string')
  ) {
    throw new RestClientError({
      status: null,
      code: 'INVALID_RESPONSE',
      message: SAFE_MESSAGES.INVALID_RESPONSE,
    });
  }
  return Object.freeze({
    id: value.id,
    patientId: value.patientId,
    medicCaretakerId: value.medicCaretakerId,
    grantedAt: value.grantedAt,
    revokedAt: value.revokedAt,
  });
}

function safeError(error) {
  const code = error instanceof RestClientError ? error.code : 'UNEXPECTED_ERROR';
  return Object.freeze({
    code,
    message: SAFE_MESSAGES[code] ?? 'The sharing request could not be completed.',
    retryable: code === 'NETWORK_ERROR' || (Number.isInteger(error?.status) && error.status >= 500),
  });
}

function success(value) {
  return Object.freeze({ ok: true, value });
}

function failure(error) {
  return Object.freeze({ ok: false, error: safeError(error) });
}

export class AccessGrantClient {
  constructor({ baseUrl, fetchImpl, restClient } = {}) {
    this.restClient = restClient ?? new RestClient({ baseUrl, fetchImpl });
    if (typeof this.restClient?.request !== 'function') {
      throw new TypeError('Access-grant client requires a REST request adapter.');
    }
    AccessGrantRepositoryPort.assert(this);
  }

  async execute(request, mapResponse) {
    try {
      return success(mapResponse(await this.restClient.request(request.path, request.options)));
    } catch (error) {
      return failure(error);
    }
  }

  listAccessGrants(patientId, token) {
    const patient = requirePositiveInteger(patientId, 'patientId');
    return this.execute(
      {
        path: `/patients/${patient}/grants`,
        options: { method: 'GET', token: requireToken(token) },
      },
      (value) => {
        if (!Array.isArray(value)) {
          throw new RestClientError({
            status: null,
            code: 'INVALID_RESPONSE',
            message: SAFE_MESSAGES.INVALID_RESPONSE,
          });
        }
        return Object.freeze(value.map(requireGrant));
      },
    );
  }

  createAccessGrant(patientId, medicCaretakerId, token) {
    const patient = requirePositiveInteger(patientId, 'patientId');
    const professional = requirePositiveInteger(medicCaretakerId, 'medicCaretakerId');
    return this.execute(
      {
        path: `/patients/${patient}/grants`,
        options: {
          method: 'POST',
          token: requireToken(token),
          body: { medicCaretakerId: professional },
        },
      },
      requireGrant,
    );
  }

  revokeAccessGrant(patientId, grantId, token) {
    const patient = requirePositiveInteger(patientId, 'patientId');
    const grant = requirePositiveInteger(grantId, 'grantId');
    return this.execute(
      {
        path: `/patients/${patient}/grants/${grant}`,
        options: { method: 'DELETE', token: requireToken(token) },
      },
      requireGrant,
    );
  }

  hasPatientAccess(patientId, token) {
    const patient = requirePositiveInteger(patientId, 'patientId');
    return this.execute(
      {
        path: `/patients/${patient}/access`,
        options: { method: 'GET', token: requireToken(token) },
      },
      (value) => {
        if (typeof value?.allowed !== 'boolean') {
          throw new RestClientError({
            status: null,
            code: 'INVALID_RESPONSE',
            message: SAFE_MESSAGES.INVALID_RESPONSE,
          });
        }
        return Object.freeze({ allowed: value.allowed });
      },
    );
  }
}
