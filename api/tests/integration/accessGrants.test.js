import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { afterEach, describe, test } from 'node:test';

import { createApp } from '../../src/app.js';
import { AccessGrantRepository } from '../../src/repositories/AccessGrantRepository.js';
import { AuthService } from '../../src/services/AuthService.js';
import { AccessGrantService } from '../../src/services/AccessGrantService.js';

const ROUTES_PATH = new URL('../../src/routes/accessGrantRoutes.js', import.meta.url);
const IMPLEMENTATION_PENDING = !existsSync(ROUTES_PATH);
const TOKEN_SECRET = 'access-grant-contract-secret-with-at-least-32-characters';

const servers = new Set();

async function requestJson(baseUrl, path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  return { body: await response.json(), response };
}

async function createHarness() {
  const [{ createAccessGrantRoutes }] = await Promise.all([import(ROUTES_PATH.href)]);
  const authService = new AuthService({ tokenSecret: TOKEN_SECRET });
  const accessGrantService = new AccessGrantService({
    repository: new AccessGrantRepository(),
    now: (() => {
      const values = ['2026-08-24T12:00:00.000Z', '2026-08-24T13:00:00.000Z'];
      return () => values.shift() ?? '2026-08-24T13:00:00.000Z';
    })(),
  });
  const app = createApp({
    authService,
    registerRoutes(application) {
      application.use(createAccessGrantRoutes({ authService, accessGrantService }));
    },
  });
  const server = await new Promise((resolve) => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
  });
  servers.add(server);
  return { baseUrl: `http://127.0.0.1:${server.address().port}`, server };
}

async function login(baseUrl, email, password) {
  const { body } = await requestJson(baseUrl, '/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return body.token;
}

function authenticated(token, options = {}) {
  return { ...options, headers: { ...options.headers, authorization: `Bearer ${token}` } };
}

afterEach(async () => {
  await Promise.all(
    [...servers].map(
      (server) =>
        new Promise((resolve, reject) =>
          server.close((error) => (error ? reject(error) : resolve())),
        ),
    ),
  );
  servers.clear();
});

describe('access-grant REST contract', () => {
  test(
    'creates, rejects a duplicate, revokes, and denies access after revocation',
    { skip: IMPLEMENTATION_PENDING },
    async () => {
      const { baseUrl } = await createHarness();
      const patientToken = await login(baseUrl, 'patient@example.com', 'Patient123!');
      const professionalToken = await login(
        baseUrl,
        'professional@example.com',
        'Professional123!',
      );
      const create = await requestJson(
        baseUrl,
        '/patients/1/grants',
        authenticated(patientToken, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ medicCaretakerId: 1 }),
        }),
      );
      assert.equal(create.response.status, 201);
      assert.deepEqual(create.body, {
        id: 1,
        patientId: 1,
        medicCaretakerId: 1,
        grantedAt: '2026-08-24T12:00:00.000Z',
        revokedAt: null,
      });

      const duplicate = await requestJson(
        baseUrl,
        '/patients/1/grants',
        authenticated(patientToken, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ medicCaretakerId: 1 }),
        }),
      );
      assert.equal(duplicate.response.status, 409);
      assert.equal(duplicate.body.error.code, 'CONFLICT');

      const allowed = await requestJson(
        baseUrl,
        '/patients/1/access',
        authenticated(professionalToken),
      );
      assert.deepEqual(allowed.body, { allowed: true });
      const revoked = await requestJson(
        baseUrl,
        '/patients/1/grants/1',
        authenticated(patientToken, { method: 'DELETE' }),
      );
      assert.equal(revoked.response.status, 200);
      assert.equal(revoked.body.revokedAt, '2026-08-24T13:00:00.000Z');
      const denied = await requestJson(
        baseUrl,
        '/patients/1/access',
        authenticated(professionalToken),
      );
      assert.deepEqual(denied.body, { allowed: false });
    },
  );

  test('does not expose grants to a non-owner', { skip: IMPLEMENTATION_PENDING }, async () => {
    const { baseUrl } = await createHarness();
    const professionalToken = await login(baseUrl, 'professional@example.com', 'Professional123!');
    const result = await requestJson(
      baseUrl,
      '/patients/1/grants',
      authenticated(professionalToken),
    );
    assert.equal(result.response.status, 403);
    assert.deepEqual(result.body, {
      error: { code: 'FORBIDDEN', message: 'Access is not permitted.' },
    });
    assert.doesNotMatch(JSON.stringify(result.body), /clinical|seizure|treatment/i);
  });
});
