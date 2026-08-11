import { createContainer } from '../../../src/composition/container.js';

function createAuthentication() {
  return {
    authenticate: jest.fn(),
    getCurrentUser: jest.fn(),
    signOut: jest.fn(),
  };
}

function createSessionStore() {
  return {
    saveSession: jest.fn(),
    loadSession: jest.fn(),
    clearSession: jest.fn(),
  };
}

describe('mobile composition container', () => {
  test('composes the sign-in use case and database behind stable dependencies', () => {
    const authentication = createAuthentication();
    const sessionStore = createSessionStore();
    const database = { initialize: jest.fn() };

    const container = createContainer({
      environment: { apiBaseUrl: 'https://api.example.test' },
      authentication,
      sessionStore,
      database,
    });

    expect(container.authentication).toBe(authentication);
    expect(container.sessionStore).toBe(sessionStore);
    expect(container.database).toBe(database);
    expect(container.signIn.authentication).toBe(authentication);
    expect(container.signIn.sessionStore).toBe(sessionStore);
    expect(container.config.apiBaseUrl).toBe('https://api.example.test');
    expect(Object.isFrozen(container)).toBe(true);
  });
});
