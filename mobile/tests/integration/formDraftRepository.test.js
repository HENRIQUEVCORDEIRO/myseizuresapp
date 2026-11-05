import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { FormDraftRepository } from '../../src/infrastructure/persistence/repositories/FormDraftRepository.js';
import { DatabaseProvider } from '../../src/infrastructure/persistence/sqlite/DatabaseProvider.js';
import { createSQLiteTestDatabase } from '../unit/factories/sqliteTestDatabase.js';

const NOW = '2026-08-11T15:00:00.000Z';

async function createProvider(databasePath) {
  const database = createSQLiteTestDatabase(databasePath);
  const provider = new DatabaseProvider({
    databaseName: databasePath,
    openDatabase: jest.fn().mockResolvedValue(database),
  });

  await provider.initialize();
  return { database, provider };
}

async function seedPatients(database) {
  for (const patientId of [1, 2]) {
    await database.runAsync(
      `INSERT INTO users (id, name, email, password_hash, role, created_at)
       VALUES (?, ?, ?, ?, 'PATIENT', ?);`,
      patientId,
      `Patient ${patientId}`,
      `patient${patientId}@example.test`,
      `test-hash-${patientId}`,
      NOW,
    );
    await database.runAsync(
      `INSERT INTO patients (id, user_id, birth_date, diagnosis_date)
       VALUES (?, ?, ?, ?);`,
      patientId,
      patientId,
      '1980-01-01',
      null,
    );
  }
}

describe('form draft SQLite repository', () => {
  let database;
  let temporaryDirectory;
  let databasePath;

  beforeEach(() => {
    temporaryDirectory = mkdtempSync(join(tmpdir(), 'myseizures-form-drafts-'));
    databasePath = join(temporaryDirectory, 'form-drafts.db');
  });

  afterEach(async () => {
    await database?.closeAsync();
    rmSync(temporaryDirectory, { force: true, recursive: true });
  });

  test('persists one draft per form and patient across reinitialization', async () => {
    const firstLaunch = await createProvider(databasePath);
    database = firstLaunch.database;
    await seedPatients(database);
    const repository = new FormDraftRepository({
      databaseProvider: firstLaunch.provider,
      now: () => NOW,
    });

    await repository.saveDraft(1, 'SEIZURE', {
      feltAura: true,
      occurredAt: '2026-08-10T12:30:00.000Z',
      occurrenceType: 'FOCAL',
    });
    await repository.saveDraft(1, 'TRIGGER', {
      causes: ['SLEEP', 'STRESS'],
      mood: 3,
      otherDescription: '',
      recordedAt: '2026-08-10T13:00:00.000Z',
      sleepQuality: 2,
    });
    await repository.saveDraft(2, 'SEIZURE', {
      feltAura: false,
      occurredAt: '2026-08-09T10:00:00.000Z',
      occurrenceType: 'GENERALIZED',
    });
    await database.closeAsync();
    database = null;

    const restartedApp = await createProvider(databasePath);
    database = restartedApp.database;
    const restartedRepository = new FormDraftRepository({
      databaseProvider: restartedApp.provider,
    });

    await expect(restartedRepository.findDraft(1, 'SEIZURE')).resolves.toEqual({
      formType: 'SEIZURE',
      payload: {
        feltAura: true,
        occurredAt: '2026-08-10T12:30:00.000Z',
        occurrenceType: 'FOCAL',
      },
      updatedAt: NOW,
    });
    await expect(restartedRepository.findDraft(1, 'TRIGGER')).resolves.toMatchObject({
      formType: 'TRIGGER',
      payload: { causes: ['SLEEP', 'STRESS'], mood: 3, sleepQuality: 2 },
    });
    await expect(restartedRepository.findDraft(2, 'SEIZURE')).resolves.toMatchObject({
      payload: { occurrenceType: 'GENERALIZED' },
    });
  });

  test('updates and clears only the requested patient draft', async () => {
    const launch = await createProvider(databasePath);
    database = launch.database;
    await seedPatients(database);
    const repository = new FormDraftRepository({ databaseProvider: launch.provider });

    await repository.saveDraft(1, 'SEIZURE', { occurrenceType: 'FOCAL' });
    await repository.saveDraft(2, 'SEIZURE', { occurrenceType: 'UNKNOWN' });
    await repository.saveDraft(1, 'SEIZURE', { occurrenceType: 'GENERALIZED' });

    await expect(repository.findDraft(1, 'SEIZURE')).resolves.toMatchObject({
      payload: { occurrenceType: 'GENERALIZED' },
    });
    await expect(repository.clearDraft(2, 'SEIZURE')).resolves.toBe(true);
    await expect(repository.findDraft(1, 'SEIZURE')).resolves.toMatchObject({
      payload: { occurrenceType: 'GENERALIZED' },
    });
    await expect(repository.findDraft(2, 'SEIZURE')).resolves.toBeNull();
  });

  test('rejects unsupported types and non-object payloads', async () => {
    const launch = await createProvider(databasePath);
    database = launch.database;
    await seedPatients(database);
    const repository = new FormDraftRepository({ databaseProvider: launch.provider });

    await expect(repository.findDraft(1, 'TREATMENT')).rejects.toBeInstanceOf(TypeError);
    await expect(repository.saveDraft(1, 'SEIZURE', [])).rejects.toBeInstanceOf(TypeError);
  });
});
