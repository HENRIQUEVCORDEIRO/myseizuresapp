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
    const database = {
      getDatabase: jest.fn(),
      initialize: jest.fn(),
      withTransaction: jest.fn(),
    };

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
    const clinicalCommands = container.clinicalForPatient(7);
    expect(clinicalCommands.recordSeizure.getActivePatientId()).toBe(7);
    expect(clinicalCommands.recordTrigger.getActivePatientId()).toBe(7);
    expect(clinicalCommands.listChronologicalEvents.getActivePatientId()).toBe(7);
    expect(container.clinicalForPatient(7)).toBe(clinicalCommands);
    const reportCommands = container.reportForPatient(7);
    expect(reportCommands.generateReport.authorizePatientAccess).toBeTruthy();
    expect(container.reportForPatient(7)).toBe(reportCommands);
    expect(container.config.apiBaseUrl).toBe('https://api.example.test');
    expect(Object.isFrozen(container)).toBe(true);
  });
});
