import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';

import { createApp } from '../src/app.js';
import { authenticate, requireRole } from '../src/middleware/authenticate.js';
import { AuthService } from '../src/services/AuthService.js';

const TOKEN_SECRET = 'test-only-token-secret-with-at-least-32-characters';

async function requestJson(baseUrl, path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  return { response, body: await response.json() };
}

describe('simulated authentication API', () => {
  let authService;
  let baseUrl;
  let server;

  before(async () => {
    authService = new AuthService({ tokenSecret: TOKEN_SECRET });
    const app = createApp({
      authService,
      registerRoutes(application) {
        application.get(
          '/patient-only',
          authenticate({ authService }),
          requireRole('PATIENT'),
          (request, response) => response.json({ userId: request.auth.id }),
        );
      },
    });

    server = await new Promise((resolve) => {
      const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
    });
    const address = server.address();
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  after(async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  async function login(email, password) {
    return requestJson(baseUrl, '/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
  }

  test('both seeded roles receive a token and the contract-safe user shape', async () => {
    for (const credentials of [
      ['patient@example.com', 'Patient123!', 'PATIENT'],
      ['professional@example.com', 'Professional123!', 'MEDIC_CARETAKER'],
    ]) {
      const [email, password, role] = credentials;
      const { response, body } = await login(email, password);

      assert.equal(response.status, 200);
      assert.equal(typeof body.token, 'string');
      assert.ok(body.token.length > 0);
      assert.deepEqual(Object.keys(body.user).sort(), ['id', 'name', 'role']);
      assert.equal(body.user.role, role);
      assert.doesNotMatch(JSON.stringify(body), /password|hash/i);
    }
  });

  test('invalid credentials return 401 without revealing account existence', async () => {
    const attempts = [
      ['patient@example.com', 'wrong-password'],
      ['unknown@example.com', 'Patient123!'],
    ];

    for (const [email, password] of attempts) {
      const { response, body } = await login(email, password);

      assert.equal(response.status, 401);
      assert.deepEqual(body, {
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Email or password is invalid.',
        },
      });
      assert.equal('token' in body, false);
    }
  });

  test('missing login fields return the validation error shape', async () => {
    const { response, body } = await login('patient@example.com', undefined);

    assert.equal(response.status, 422);
    assert.deepEqual(body, {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Email and password are required.',
      },
    });
  });

  test('a valid bearer token restores the current safe user profile', async () => {
    const loginResult = await login('patient@example.com', 'Patient123!');
    const { response, body } = await requestJson(baseUrl, '/users/me', {
      headers: { authorization: `Bearer ${loginResult.body.token}` },
    });

    assert.equal(response.status, 200);
    assert.deepEqual(body, loginResult.body.user);
  });

  test('missing and tampered bearer tokens return 401', async () => {
    const loginResult = await login('patient@example.com', 'Patient123!');
    const attempts = [undefined, `Bearer ${loginResult.body.token}tampered`];

    for (const authorization of attempts) {
      const headers = authorization ? { authorization } : {};
      const { response, body } = await requestJson(baseUrl, '/users/me', { headers });

      assert.equal(response.status, 401);
      assert.equal(body.error.code, 'UNAUTHENTICATED');
    }
  });

  test('role middleware allows patients and denies professionals', async () => {
    const patient = await login('patient@example.com', 'Patient123!');
    const professional = await login('professional@example.com', 'Professional123!');

    const allowed = await requestJson(baseUrl, '/patient-only', {
      headers: { authorization: `Bearer ${patient.body.token}` },
    });
    const denied = await requestJson(baseUrl, '/patient-only', {
      headers: { authorization: `Bearer ${professional.body.token}` },
    });

    assert.equal(allowed.response.status, 200);
    assert.deepEqual(allowed.body, { userId: patient.body.user.id });
    assert.equal(denied.response.status, 403);
    assert.deepEqual(denied.body, {
      error: {
        code: 'FORBIDDEN',
        message: 'Access is not permitted.',
      },
    });
  });

  test('expired tokens fail verification', () => {
    let now = Date.parse('2026-08-10T12:00:00.000Z');
    const service = new AuthService({
      tokenSecret: TOKEN_SECRET,
      tokenTtlSeconds: 1,
      now: () => now,
    });
    const result = service.signIn('patient@example.com', 'Patient123!');

    now += 2_000;

    assert.equal(service.verifyToken(result.token), null);
  });
});
