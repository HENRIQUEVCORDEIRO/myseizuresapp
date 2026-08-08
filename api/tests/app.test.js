import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';

import { createApp } from '../src/app.js';

describe('API application', () => {
  let baseUrl;
  let server;

  before(async () => {
    const app = createApp();

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

  test('GET /health returns a JSON readiness response', async () => {
    const response = await fetch(`${baseUrl}/health`);

    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /^application\/json/);
    assert.deepEqual(await response.json(), { status: 'ok' });
  });

  test('malformed JSON receives the contract validation-error shape', async () => {
    const response = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{"email":',
    });

    assert.equal(response.status, 422);
    assert.match(response.headers.get('content-type'), /^application\/json/);
    assert.deepEqual(await response.json(), {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request body must contain valid JSON.',
      },
    });
  });

  test('unknown routes receive the contract not-found shape', async () => {
    const response = await fetch(`${baseUrl}/does-not-exist`);

    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), {
      error: {
        code: 'NOT_FOUND',
        message: 'The requested resource was not found.',
      },
    });
  });

  test('unexpected errors are redacted behind a JSON response', async () => {
    const app = createApp({
      registerRoutes(application) {
        application.get('/failure', () => {
          throw new Error('database credentials leaked here');
        });
      },
    });
    const temporaryServer = await new Promise((resolve) => {
      const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
    });
    const address = temporaryServer.address();

    try {
      const response = await fetch(`http://127.0.0.1:${address.port}/failure`);
      const body = await response.json();

      assert.equal(response.status, 500);
      assert.deepEqual(body, {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred.',
        },
      });
      assert.doesNotMatch(JSON.stringify(body), /credentials/);
    } finally {
      await new Promise((resolve, reject) => {
        temporaryServer.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });
});
