import { SignIn, SignInInputError } from '../../../src/application/use-cases/SignIn.js';
import { RestClientError } from '../../../src/infrastructure/api/RestClient.js';

function tokenWithExpiration(exp = 2_000_000_000) {
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${encode({ alg: 'none' })}.${encode({ exp })}.signature`;
}

const validSession = {
  token: tokenWithExpiration(),
  user: { id: 1, name: 'Demo Patient', role: 'PATIENT' },
};

const persistedSession = {
  ...validSession,
  tokenExpiresAt: 2_000_000_000,
  user: { ...validSession.user, patientId: 1 },
};

function createAuthentication() {
  return {
    authenticate: jest.fn().mockResolvedValue(validSession),
    getCurrentUser: jest.fn().mockResolvedValue(validSession.user),
    signOut: jest.fn().mockResolvedValue(undefined),
  };
}

function createSessionStore() {
  return {
    saveSession: jest.fn().mockResolvedValue(undefined),
    loadSession: jest.fn().mockResolvedValue(null),
    clearSession: jest.fn().mockResolvedValue(undefined),
  };
}

describe('SignIn', () => {
  test('authenticates and persists a successful session', async () => {
    const authentication = createAuthentication();
    const sessionStore = createSessionStore();
    const signIn = new SignIn({ authentication, sessionStore });

    await expect(
      signIn.execute({ email: ' patient@example.com ', password: 'Patient123!' }),
    ).resolves.toEqual(persistedSession);
    expect(authentication.authenticate).toHaveBeenCalledWith('patient@example.com', 'Patient123!');
    expect(sessionStore.saveSession).toHaveBeenCalledWith(persistedSession);
  });

  test.each([
    [{ email: '', password: 'password' }],
    [{ email: 'patient@example.com', password: '' }],
    [null],
  ])('rejects invalid credentials before calling infrastructure', async (input) => {
    const authentication = createAuthentication();
    const signIn = new SignIn({ authentication, sessionStore: createSessionStore() });

    await expect(signIn.execute(input)).rejects.toBeInstanceOf(SignInInputError);
    expect(authentication.authenticate).not.toHaveBeenCalled();
  });

  test('restores a session only after the API validates its stored token', async () => {
    const authentication = createAuthentication();
    const sessionStore = createSessionStore();
    sessionStore.loadSession.mockResolvedValue({
      ...validSession,
      tokenExpiresAt: 2_000_000_000,
    });
    const signIn = new SignIn({ authentication, sessionStore });

    await expect(signIn.restoreSession()).resolves.toEqual(persistedSession);
    expect(authentication.getCurrentUser).toHaveBeenCalledWith(validSession.token);
    expect(sessionStore.saveSession).toHaveBeenCalledWith(persistedSession);
  });

  test('clears a session when the API rejects its token', async () => {
    const authentication = createAuthentication();
    authentication.getCurrentUser.mockRejectedValue(
      new RestClientError({
        status: 401,
        code: 'UNAUTHENTICATED',
        message: 'Authentication is required.',
      }),
    );
    const sessionStore = createSessionStore();
    sessionStore.loadSession.mockResolvedValue({
      ...validSession,
      tokenExpiresAt: 2_000_000_000,
    });
    const signIn = new SignIn({ authentication, sessionStore });

    await expect(signIn.restoreSession()).resolves.toBeNull();
    expect(sessionStore.clearSession).toHaveBeenCalledTimes(1);
  });

  test('restores an unexpired cached session when the profile request is offline', async () => {
    const authentication = createAuthentication();
    const networkError = new RestClientError({
      status: null,
      code: 'NETWORK_ERROR',
      message: 'Unable to reach the authentication service.',
    });
    authentication.getCurrentUser.mockRejectedValue(networkError);
    const sessionStore = createSessionStore();
    const storedSession = {
      ...validSession,
      tokenExpiresAt: 2_000_000_000,
      user: { ...validSession.user, patientId: 1 },
    };
    sessionStore.loadSession.mockResolvedValue(storedSession);
    const signIn = new SignIn({ authentication, sessionStore });

    await expect(signIn.restoreSession()).resolves.toEqual(storedSession);
    expect(sessionStore.clearSession).not.toHaveBeenCalled();
  });

  test('clears an expired cached session without calling the API', async () => {
    const authentication = createAuthentication();
    const sessionStore = createSessionStore();
    sessionStore.loadSession.mockResolvedValue({
      ...validSession,
      tokenExpiresAt: 1_000,
      user: { ...validSession.user, patientId: 1 },
    });
    const signIn = new SignIn({ authentication, sessionStore, now: () => 1_000_000 });

    await expect(signIn.restoreSession()).resolves.toBeNull();
    expect(authentication.getCurrentUser).not.toHaveBeenCalled();
    expect(sessionStore.clearSession).toHaveBeenCalledTimes(1);
  });

  test('sign-out clears local state even if the remote adapter fails', async () => {
    const authentication = createAuthentication();
    authentication.signOut.mockRejectedValue(new Error('remote unavailable'));
    const sessionStore = createSessionStore();
    const signIn = new SignIn({ authentication, sessionStore });

    await expect(signIn.signOut()).rejects.toThrow('remote unavailable');
    expect(sessionStore.clearSession).toHaveBeenCalledTimes(1);
  });
});
