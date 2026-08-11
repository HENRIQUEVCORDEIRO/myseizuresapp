jest.mock('expo-secure-store', () => ({
  AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 1,
  deleteItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
}));

import { AuthenticationPort, SessionStorePort } from '../../../src/application/ports/index.js';
import { RestClient, RestClientError } from '../../../src/infrastructure/api/RestClient.js';
import {
  SECURE_SESSION_KEY,
  SessionStore,
} from '../../../src/infrastructure/security/SessionStore.js';

function jsonResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(body),
  };
}

describe('RestClient authentication adapter', () => {
  test('implements the authentication port and sends credentials as JSON', async () => {
    const payload = {
      token: 'signed-token',
      user: { id: 1, name: 'Demo Patient', role: 'PATIENT' },
    };
    const fetchImpl = jest.fn().mockResolvedValue(jsonResponse(payload));
    const client = new RestClient({ baseUrl: 'http://localhost:3000/', fetchImpl });

    expect(AuthenticationPort.assert(client)).toBe(client);
    await expect(client.authenticate('patient@example.com', 'Patient123!')).resolves.toEqual(
      payload,
    );
    expect(fetchImpl).toHaveBeenCalledWith('http://localhost:3000/auth/login', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ email: 'patient@example.com', password: 'Patient123!' }),
    });
  });

  test('validates a stored token with the protected current-user endpoint', async () => {
    const user = { id: 2, name: 'Demo Professional', role: 'MEDIC_CARETAKER' };
    const fetchImpl = jest.fn().mockResolvedValue(jsonResponse(user));
    const client = new RestClient({ baseUrl: 'https://api.example.test', fetchImpl });

    await expect(client.getCurrentUser('signed-token')).resolves.toEqual(user);
    expect(fetchImpl).toHaveBeenCalledWith('https://api.example.test/users/me', {
      method: 'GET',
      headers: {
        accept: 'application/json',
        authorization: 'Bearer signed-token',
      },
    });
  });

  test('maps contract errors without exposing arbitrary response fields', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(
      jsonResponse(
        {
          error: { code: 'UNAUTHENTICATED', message: 'Authentication is required.' },
          passwordHash: 'must-not-leak',
        },
        401,
      ),
    );
    const client = new RestClient({ baseUrl: 'https://api.example.test', fetchImpl });

    await expect(client.getCurrentUser('expired-token')).rejects.toMatchObject({
      name: 'RestClientError',
      status: 401,
      code: 'UNAUTHENTICATED',
      message: 'Authentication is required.',
    });
  });

  test('maps transport failures to a retryable network error', async () => {
    const client = new RestClient({
      baseUrl: 'https://api.example.test',
      fetchImpl: jest.fn().mockRejectedValue(new Error('socket details')),
    });

    await expect(client.authenticate('patient@example.com', 'password')).rejects.toEqual(
      expect.objectContaining({
        name: 'RestClientError',
        status: null,
        code: 'NETWORK_ERROR',
      }),
    );
  });

  test('rejects invalid successful payloads', async () => {
    const client = new RestClient({
      baseUrl: 'https://api.example.test',
      fetchImpl: jest.fn().mockResolvedValue(jsonResponse({ token: 'token', user: {} })),
    });

    await expect(client.authenticate('patient@example.com', 'password')).rejects.toBeInstanceOf(
      RestClientError,
    );
  });
});

describe('SessionStore secure adapter', () => {
  function createSecureStore() {
    return {
      AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 1,
      deleteItemAsync: jest.fn().mockResolvedValue(undefined),
      getItemAsync: jest.fn().mockResolvedValue(null),
      setItemAsync: jest.fn().mockResolvedValue(undefined),
    };
  }

  test('implements the session port and stores only the token securely', async () => {
    const secureStore = createSecureStore();
    const store = new SessionStore({ secureStore });

    expect(SessionStorePort.assert(store)).toBe(store);
    await store.saveSession({
      token: 'signed-token',
      user: { id: 1, name: 'Demo Patient', role: 'PATIENT' },
    });

    expect(secureStore.setItemAsync).toHaveBeenCalledWith(SECURE_SESSION_KEY, 'signed-token', {
      keychainAccessible: secureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
    });
  });

  test('loads and clears the stored token', async () => {
    const secureStore = createSecureStore();
    secureStore.getItemAsync.mockResolvedValue('signed-token');
    const store = new SessionStore({ secureStore });

    await expect(store.loadSession()).resolves.toEqual({ token: 'signed-token' });
    await store.clearSession();

    expect(secureStore.getItemAsync).toHaveBeenCalledWith(SECURE_SESSION_KEY);
    expect(secureStore.deleteItemAsync).toHaveBeenCalledWith(SECURE_SESSION_KEY);
  });
});
