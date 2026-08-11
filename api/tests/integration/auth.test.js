import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';

import { createApp } from '../../src/app.js';
import { authenticate, requireRole } from '../../src/middleware/authenticate.js';
import { AuthService, UserRole } from '../../src/services/AuthService.js';

const TOKEN_SECRET = 'integration-test-token-secret-with-at-least-32-characters';
const DEMO_ACCOUNTS = [
  {
    email: 'patient@example.com',
    password: 'Patient123!',
    role: UserRole.PATIENT,
  },
  {
    email: 'professional@example.com',
    password: 'Professional123!',
    role: UserRole.MEDIC_CARETAKER,
  },
];

async function requestJson(baseUrl, path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  return { body: await response.json(), response };
}

describe('authentication REST contract', () => {
  let baseUrl;
  let server;

  before(async () => {
    const authService = new AuthService({ tokenSecret: TOKEN_SECRET });
    const app = createApp({
      authService,
      registerRoutes(application) {
        application.get(
          '/authorization/patient',
          authenticate({ authService }),
          requireRole(UserRole.PATIENT),
          (_request, response) => response.json({ allowed: true }),
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

  async function login({ email, password }) {
    return requestJson(baseUrl, '/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
  }

  test('seeded patient and professional accounts satisfy the login response contract', async () => {
    for (const account of DEMO_ACCOUNTS) {
      const { body, response } = await login(account);

      assert.equal(response.status, 200);
      assert.equal(typeof body.token, 'string');
      assert.ok(body.token.length > 0);
      assert.deepEqual(Object.keys(body.user).sort(), ['id', 'name', 'role']);
      assert.equal(body.user.role, account.role);
      assert.doesNotMatch(JSON.stringify(body), /password|hash/i);
    }
  });

  test('a login token restores the same safe current-user profile', async () => {
    const loginResult = await login(DEMO_ACCOUNTS[0]);
    const { body, response } = await requestJson(baseUrl, '/users/me', {
      headers: { authorization: `Bearer ${loginResult.body.token}` },
    });

    assert.equal(response.status, 200);
    assert.deepEqual(body, loginResult.body.user);
  });

  test('invalid credentials return the documented 401 shape without a token', async () => {
    const { body, response } = await login({
      email: DEMO_ACCOUNTS[0].email,
      password: 'incorrect-password',
    });

    assert.equal(response.status, 401);
    assert.deepEqual(body, {
      error: {
        code: 'UNAUTHENTICATED',
        message: 'Email or password is invalid.',
      },
    });
    assert.equal('token' in body, false);
  });

  test('role authorization denies a professional from the patient-only endpoint', async () => {
    const professional = await login(DEMO_ACCOUNTS[1]);
    const { body, response } = await requestJson(baseUrl, '/authorization/patient', {
      headers: { authorization: `Bearer ${professional.body.token}` },
    });

    assert.equal(response.status, 403);
    assert.deepEqual(body, {
      error: {
        code: 'FORBIDDEN',
        message: 'Access is not permitted.',
      },
    });
  });
});
