import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { SeizureRecord, TriggerRecord } from '../../src/domain/entities/index.js';
import { SeizureOccurrenceType, TriggerCause } from '../../src/domain/value-objects/index.js';
import { SeizureRepository } from '../../src/infrastructure/persistence/repositories/SeizureRepository.js';
import { TriggerRepository } from '../../src/infrastructure/persistence/repositories/TriggerRepository.js';
import { DatabaseProvider } from '../../src/infrastructure/persistence/sqlite/DatabaseProvider.js';
import { createSQLiteTestDatabase } from '../unit/factories/sqliteTestDatabase.js';

const PERIOD = Object.freeze({
  periodStart: '2026-07-01T00:00:00.000Z',
  periodEnd: '2026-07-31T23:59:59.999Z',
});

function seizure(overrides = {}) {
  return new SeizureRecord({
    patientId: 1,
    occurredAt: '2026-07-10T08:30:00.000Z',
    occurrenceType: SeizureOccurrenceType.FOCAL,
    createdAt: '2026-07-10T08:35:00.000Z',
    ...overrides,
  });
}

function trigger(overrides = {}) {
  return new TriggerRecord({
    patientId: 1,
    recordedAt: '2026-07-10T09:00:00.000Z',
    commonCause: TriggerCause.OTHER,
    otherDescription: 'Interrupted sleep',
    sleepQuality: 2,
    mood: 3,
    createdAt: '2026-07-10T09:05:00.000Z',
    ...overrides,
  });
}

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
      '2026-07-01T00:00:00.000Z',
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

describe('clinical record SQLite repositories', () => {
  let database;
  let temporaryDirectory;
  let databasePath;

  beforeEach(() => {
    temporaryDirectory = mkdtempSync(join(tmpdir(), 'myseizures-clinical-records-'));
    databasePath = join(temporaryDirectory, 'clinical-records.db');
  });

  afterEach(async () => {
    await database?.closeAsync();
    rmSync(temporaryDirectory, { force: true, recursive: true });
  });

  test('seizure and trigger records survive database-provider reinitialization', async () => {
    const firstLaunch = await createProvider(databasePath);
    database = firstLaunch.database;
    await seedPatients(database);
    const seizureRepository = new SeizureRepository({ databaseProvider: firstLaunch.provider });
    const triggerRepository = new TriggerRepository({ databaseProvider: firstLaunch.provider });

    const savedSeizure = await seizureRepository.saveSeizure(
      seizure({ occurrenceType: SeizureOccurrenceType.GENERALIZED }),
    );
    const savedTrigger = await triggerRepository.saveTrigger(trigger());

    expect(savedSeizure.id).toEqual(expect.any(Number));
    expect(savedTrigger.id).toEqual(expect.any(Number));
    await database.closeAsync();
    database = null;

    const restartedApp = await createProvider(databasePath);
    database = restartedApp.database;
    const restartedSeizureRepository = new SeizureRepository({
      databaseProvider: restartedApp.provider,
    });
    const restartedTriggerRepository = new TriggerRepository({
      databaseProvider: restartedApp.provider,
    });

    await expect(restartedSeizureRepository.listSeizuresByPeriod(1, PERIOD)).resolves.toEqual([
      savedSeizure,
    ]);
    await expect(restartedTriggerRepository.listTriggersByPeriod(1, PERIOD)).resolves.toEqual([
      savedTrigger,
    ]);
  });

  test('period queries are inclusive, chronological, and isolated by patient', async () => {
    const launch = await createProvider(databasePath);
    database = launch.database;
    await seedPatients(database);
    const seizureRepository = new SeizureRepository({ databaseProvider: launch.provider });
    const triggerRepository = new TriggerRepository({ databaseProvider: launch.provider });

    for (const record of [
      seizure({ occurredAt: '2026-06-30T23:59:59.999Z' }),
      seizure({ occurredAt: PERIOD.periodEnd, occurrenceType: SeizureOccurrenceType.OTHER }),
      seizure({ occurredAt: PERIOD.periodStart, occurrenceType: SeizureOccurrenceType.UNKNOWN }),
      seizure({ patientId: 2, occurredAt: '2026-07-15T12:00:00.000Z' }),
    ]) {
      await seizureRepository.saveSeizure(record);
    }

    for (const record of [
      trigger({ recordedAt: '2026-08-01T00:00:00.000Z' }),
      trigger({
        recordedAt: '2026-07-20T10:00:00.000Z',
        commonCause: TriggerCause.STRESS,
        otherDescription: undefined,
      }),
      trigger({
        recordedAt: '2026-07-05T10:00:00.000Z',
        commonCause: TriggerCause.SLEEP,
        otherDescription: undefined,
      }),
      trigger({ patientId: 2, recordedAt: '2026-07-15T12:00:00.000Z' }),
    ]) {
      await triggerRepository.saveTrigger(record);
    }

    const seizures = await seizureRepository.listSeizuresByPeriod(1, PERIOD);
    const triggers = await triggerRepository.listTriggersByPeriod(1, PERIOD);

    expect(seizures.map(({ patientId, occurredAt }) => [patientId, occurredAt])).toEqual([
      [1, PERIOD.periodStart],
      [1, PERIOD.periodEnd],
    ]);
    expect(triggers.map(({ patientId, recordedAt }) => [patientId, recordedAt])).toEqual([
      [1, '2026-07-05T10:00:00.000Z'],
      [1, '2026-07-20T10:00:00.000Z'],
    ]);
  });

  test('find, update, and delete retain fields and enforce patient scope', async () => {
    const launch = await createProvider(databasePath);
    database = launch.database;
    await seedPatients(database);
    const seizureRepository = new SeizureRepository({ databaseProvider: launch.provider });
    const triggerRepository = new TriggerRepository({ databaseProvider: launch.provider });

    const savedSeizure = await seizureRepository.saveSeizure(seizure());
    const savedTrigger = await triggerRepository.saveTrigger(trigger());
    const updatedSeizure = new SeizureRecord({
      ...savedSeizure,
      occurrenceType: SeizureOccurrenceType.GENERALIZED,
    });
    const updatedTrigger = new TriggerRecord({
      ...savedTrigger,
      commonCause: TriggerCause.STRESS,
      otherDescription: null,
      sleepQuality: 4,
      mood: 2,
    });

    await expect(seizureRepository.saveSeizure(updatedSeizure)).resolves.toEqual(updatedSeizure);
    await expect(triggerRepository.saveTrigger(updatedTrigger)).resolves.toEqual(updatedTrigger);
    await expect(seizureRepository.findSeizureById(1, savedSeizure.id)).resolves.toEqual(
      updatedSeizure,
    );
    await expect(triggerRepository.findTriggerById(1, savedTrigger.id)).resolves.toEqual(
      updatedTrigger,
    );
    await expect(seizureRepository.findSeizureById(2, savedSeizure.id)).resolves.toBeNull();
    await expect(triggerRepository.findTriggerById(2, savedTrigger.id)).resolves.toBeNull();
    await expect(seizureRepository.deleteSeizure(2, savedSeizure.id)).resolves.toBe(false);
    await expect(triggerRepository.deleteTrigger(2, savedTrigger.id)).resolves.toBe(false);
    await expect(seizureRepository.deleteSeizure(1, savedSeizure.id)).resolves.toBe(true);
    await expect(triggerRepository.deleteTrigger(1, savedTrigger.id)).resolves.toBe(true);
    await expect(seizureRepository.findSeizureById(1, savedSeizure.id)).resolves.toBeNull();
    await expect(triggerRepository.findTriggerById(1, savedTrigger.id)).resolves.toBeNull();
  });
});
