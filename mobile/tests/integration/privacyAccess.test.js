jest.mock('expo-secure-store', () => ({
  AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 1,
  deleteItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
}));

import { SignIn } from '../../src/application/use-cases/SignIn.js';
import {
  GenerateReport,
  ReportAccessDeniedError,
} from '../../src/application/use-cases/reporting/index.js';
import { RndsExportMapper } from '../../src/infrastructure/export/RndsExportMapper.js';
import { SeizureRepository } from '../../src/infrastructure/persistence/repositories/index.js';
import { DatabaseProvider } from '../../src/infrastructure/persistence/sqlite/DatabaseProvider.js';
import {
  SECURE_SESSION_KEY,
  SessionStore,
} from '../../src/infrastructure/security/SessionStore.js';
import {
  GuardDecision,
  resolveProtectedRoute,
} from '../../src/presentation/navigation/routePolicy.js';
import { createSQLiteTestDatabase } from '../unit/factories/sqliteTestDatabase.js';

const PATIENT_TOKEN = 'signed-patient-token';

function createSecureStore() {
  return {
    AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 1,
    deleteItemAsync: jest.fn().mockResolvedValue(undefined),
    getItemAsync: jest.fn().mockResolvedValue(null),
    setItemAsync: jest.fn().mockResolvedValue(undefined),
  };
}

function createAuthentication(overrides = {}) {
  return {
    authenticate: jest.fn().mockResolvedValue({
      token: PATIENT_TOKEN,
      user: { id: 1, patientId: 1, name: 'Demo Patient', role: 'PATIENT' },
    }),
    getCurrentUser: jest.fn(),
    signOut: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function privateRepositories() {
  return {
    seizureRepository: { listSeizuresByPeriod: jest.fn() },
    triggerRepository: { listTriggersByPeriod: jest.fn() },
    treatmentRepository: { listAdherenceByPeriod: jest.fn() },
  };
}

describe('session and role privacy boundaries', () => {
  test('persists only the token and clears a server-rejected session', async () => {
    const secureStore = createSecureStore();
    const sessionStore = new SessionStore({ secureStore });
    const authentication = createAuthentication();
    const signIn = new SignIn({ authentication, sessionStore });

    const session = await signIn.execute({
      email: ' Patient@Example.Test ',
      password: 'private-password',
    });

    expect(session.user).toMatchObject({ id: 1, role: 'PATIENT' });
    expect(secureStore.setItemAsync).toHaveBeenCalledWith(SECURE_SESSION_KEY, PATIENT_TOKEN, {
      keychainAccessible: secureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
    });
    expect(JSON.stringify(secureStore.setItemAsync.mock.calls)).not.toMatch(
      /private-password|patient@example|Demo Patient/i,
    );

    secureStore.getItemAsync.mockResolvedValue(PATIENT_TOKEN);
    authentication.getCurrentUser.mockRejectedValue({
      status: 401,
      code: 'UNAUTHENTICATED',
      message: 'Authentication is required.',
    });

    await expect(signIn.restoreSession()).resolves.toBeNull();
    expect(secureStore.deleteItemAsync).toHaveBeenCalledWith(SECURE_SESSION_KEY);
  });

  test('role policy rejects cross-role and unauthenticated access', () => {
    expect(
      resolveProtectedRoute({
        allowedRoles: ['MEDIC_CARETAKER'],
        status: 'authenticated',
        user: { id: 1, role: 'PATIENT' },
      }),
    ).toBe(GuardDecision.FORBIDDEN);
    expect(
      resolveProtectedRoute({
        allowedRoles: ['PATIENT'],
        status: 'authenticated',
        user: { id: 2, role: 'MEDIC_CARETAKER' },
      }),
    ).toBe(GuardDecision.FORBIDDEN);
    expect(
      resolveProtectedRoute({ allowedRoles: ['PATIENT'], status: 'unauthenticated', user: null }),
    ).toBe(GuardDecision.SIGN_IN);
  });
});

describe('patient-scoped clinical persistence', () => {
  test("SQLite queries never return another patient's record", async () => {
    const database = createSQLiteTestDatabase();
    const provider = new DatabaseProvider({
      databaseName: 'privacy-access.db',
      openDatabase: jest.fn().mockResolvedValue(database),
    });

    try {
      await provider.initialize();
      await database.execAsync(`
        INSERT INTO users (id, name, email, password_hash, role, created_at) VALUES
          (1, 'Patient One', 'one@example.test', 'hash-one', 'PATIENT', '2026-08-01T00:00:00.000Z'),
          (2, 'Patient Two', 'two@example.test', 'hash-two', 'PATIENT', '2026-08-01T00:00:00.000Z');
        INSERT INTO patients (id, user_id, birth_date) VALUES
          (1, 1, '1980-01-01'),
          (2, 2, '1985-02-02');
        INSERT INTO seizure_records
          (id, patient_id, occurred_at, occurrence_type, created_at) VALUES
          (11, 1, '2026-08-20T08:00:00.000Z', 'FOCAL', '2026-08-20T08:01:00.000Z'),
          (22, 2, '2026-08-20T09:00:00.000Z', 'GENERALIZED', '2026-08-20T09:01:00.000Z');
      `);
      const repository = new SeizureRepository({ databaseProvider: provider });
      const period = {
        periodStart: '2026-08-20T00:00:00.000Z',
        periodEnd: '2026-08-20T23:59:59.999Z',
      };

      await expect(repository.listSeizuresByPeriod(1, period)).resolves.toEqual([
        expect.objectContaining({ id: 11, patientId: 1 }),
      ]);
      await expect(repository.listSeizuresByPeriod(2, period)).resolves.toEqual([
        expect.objectContaining({ id: 22, patientId: 2 }),
      ]);
      await expect(repository.findSeizureById(1, 22)).resolves.toBeNull();
    } finally {
      await database.closeAsync();
    }
  });
});

describe('report and export privacy boundaries', () => {
  test('denied report access performs no clinical query and exposes no clinical detail', async () => {
    const repositories = privateRepositories();
    const authorizePatientAccess = {
      execute: jest.fn().mockResolvedValue({ ok: true, value: { allowed: false } }),
    };
    const generateReport = new GenerateReport({
      ...repositories,
      authorizePatientAccess,
      getActivePatientId: () => null,
    });

    let deniedError;
    try {
      await generateReport.execute({
        patientId: 2,
        periodType: 'WEEKLY',
        periodEnd: '2026-08-27T23:59:59.999Z',
      });
    } catch (error) {
      deniedError = error;
    }

    expect(deniedError).toBeInstanceOf(ReportAccessDeniedError);
    expect(deniedError.message).toBe('Access is not permitted.');
    expect(JSON.stringify(deniedError)).not.toMatch(/seizure|trigger|adherence|patient 2/i);
    expect(authorizePatientAccess.execute).toHaveBeenCalledWith({ patientId: 2 });
    expect(repositories.seizureRepository.listSeizuresByPeriod).not.toHaveBeenCalled();
    expect(repositories.triggerRepository.listTriggersByPeriod).not.toHaveBeenCalled();
    expect(repositories.treatmentRepository.listAdherenceByPeriod).not.toHaveBeenCalled();
  });

  test('versioned export allow-list excludes credentials and internal profile fields', () => {
    const mapper = new RndsExportMapper({ now: () => '2026-08-27T12:00:00.000Z' });
    const document = mapper.map({
      patient: {
        id: 1,
        userId: 91,
        birthDate: '1980-01-01',
        diagnosisDate: '2020-01-01',
        email: 'patient@example.test',
        passwordHash: 'private-password-hash',
        accessToken: PATIENT_TOKEN,
      },
      report: {
        patientId: 1,
        period: {
          periodStart: '2026-08-21T00:00:00.000Z',
          periodEnd: '2026-08-27T23:59:59.999Z',
        },
        seizures: [
          {
            patientId: 1,
            occurredAt: '2026-08-24T09:00:00.000Z',
            occurrenceType: 'FOCAL',
            createdAt: '2026-08-24T09:01:00.000Z',
          },
        ],
        triggers: [],
        adherence: { finalDoses: 0, takenDoses: 0 },
        alerts: [],
      },
    });
    const serialized = JSON.stringify(document);

    expect(document).toMatchObject({
      formatVersion: '1.0',
      patient: { id: 1, birthDate: '1980-01-01' },
    });
    expect(serialized).not.toMatch(
      /password|hash|token|email|diagnosisDate|userId|createdAt|private/i,
    );
  });
});
