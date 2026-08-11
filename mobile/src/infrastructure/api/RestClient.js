import { UserRole } from '../../domain/value-objects/index.js';

const VALID_ROLES = new Set(Object.values(UserRole));

export class RestClientError extends Error {
  constructor({ status, code, message, cause }) {
    super(message);
    this.name = 'RestClientError';
    this.status = status;
    this.code = code;

    if (cause !== undefined) {
      this.cause = cause;
    }
  }
}

function requireBaseUrl(value) {
  try {
    const url = new URL(value);

    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('Unsupported protocol.');
    }

    return url.toString().replace(/\/$/, '');
  } catch {
    throw new TypeError('REST client base URL must be a valid HTTP or HTTPS URL.');
  }
}

function requireToken(token) {
  if (typeof token !== 'string' || !token.trim()) {
    throw new TypeError('Authentication token must be a non-empty string.');
  }

  return token;
}

function requireUser(value) {
  if (
    !value ||
    !Number.isInteger(value.id) ||
    value.id < 1 ||
    typeof value.name !== 'string' ||
    !value.name.trim() ||
    !VALID_ROLES.has(value.role)
  ) {
    throw new RestClientError({
      status: null,
      code: 'INVALID_RESPONSE',
      message: 'The authentication service returned an invalid user.',
    });
  }

  return {
    id: value.id,
    name: value.name.trim(),
    role: value.role,
  };
}

function requireAuthenticationResponse(value) {
  if (!value || typeof value.token !== 'string' || !value.token.trim()) {
    throw new RestClientError({
      status: null,
      code: 'INVALID_RESPONSE',
      message: 'The authentication service returned an invalid session.',
    });
  }

  return {
    token: value.token,
    user: requireUser(value.user),
  };
}

export class RestClient {
  constructor({ baseUrl, fetchImpl = globalThis.fetch }) {
    if (typeof fetchImpl !== 'function') {
      throw new TypeError('REST client requires a fetch implementation.');
    }

    this.baseUrl = requireBaseUrl(baseUrl);
    this.fetchImpl = fetchImpl;
  }

  async authenticate(email, password) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: { email, password },
    });

    return requireAuthenticationResponse(response);
  }

  async getCurrentUser(token) {
    const response = await this.request('/users/me', {
      method: 'GET',
      token: requireToken(token),
    });

    return requireUser(response);
  }

  async signOut() {
    // The simulated API has no server-side session to revoke.
  }

  async request(path, { method, token, body } = {}) {
    const headers = { accept: 'application/json' };
    const options = { method: method ?? 'GET', headers };

    if (token) {
      headers.authorization = `Bearer ${token}`;
    }

    if (body !== undefined) {
      headers['content-type'] = 'application/json';
      options.body = JSON.stringify(body);
    }

    let response;

    try {
      response = await this.fetchImpl(`${this.baseUrl}${path}`, options);
    } catch (cause) {
      throw new RestClientError({
        status: null,
        code: 'NETWORK_ERROR',
        message: 'Unable to reach the authentication service.',
        cause,
      });
    }

    let payload;

    try {
      payload = await response.json();
    } catch (cause) {
      throw new RestClientError({
        status: response.status,
        code: 'INVALID_RESPONSE',
        message: 'The authentication service returned invalid JSON.',
        cause,
      });
    }

    if (!response.ok) {
      const contractError = payload?.error;
      const hasContractError =
        typeof contractError?.code === 'string' && typeof contractError?.message === 'string';

      throw new RestClientError({
        status: response.status,
        code: hasContractError ? contractError.code : 'HTTP_ERROR',
        message: hasContractError
          ? contractError.message
          : 'The authentication request was rejected.',
      });
    }

    return payload;
  }
}
