import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { SeizureRecord, Treatment } from '../../src/domain/entities/index.js';
import { SeizureOccurrenceType, TreatmentType } from '../../src/domain/value-objects/index.js';
import { LocalIdentityRepository } from '../../src/infrastructure/persistence/repositories/LocalIdentityRepository.js';
import { SeizureRepository } from '../../src/infrastructure/persistence/repositories/SeizureRepository.js';
import { TreatmentRepository } from '../../src/infrastructure/persistence/repositories/TreatmentRepository.js';
import { DatabaseProvider } from '../../src/infrastructure/persistence/sqlite/DatabaseProvider.js';
import { createSQLiteTestDatabase } from '../unit/factories/sqliteTestDatabase.js';

const NOW = '2026-10-25T15:00:00.000Z';
const PATIENT = Object.freeze({
  id: 7,
  name: 'Paciente Local',
  email: 'patient@example.com',
  role: 'PATIENT',
  patientId: 42,
  birthDate: '1990-01-01',
  diagnosisDate: null,
});

async function createProvider(databasePath) {
  const database = createSQLiteTestDatabase(databasePath);
  const provider = new DatabaseProvider({
    databaseName: databasePath,
    openDatabase: jest.fn().mockResolvedValue(database),
  });

  await provider.initialize();
  return { database, provider };
}

describe('local authenticated identity', () => {
  let database;
  let provider;
  let temporaryDirectory;

  beforeEach(async () => {
    temporaryDirectory = mkdtempSync(join(tmpdir(), 'myseizures-identity-'));
    ({ database, provider } = await createProvider(join(temporaryDirectory, 'identity.db')));
  });

  afterEach(async () => {
    await database?.closeAsync();
    rmSync(temporaryDirectory, { force: true, recursive: true });
  });

  test('creates the user and patient rows with foreign keys on before any clinical save', async () => {
    const identity = new LocalIdentityRepository({ databaseProvider: provider, now: () => NOW });

    await expect(identity.synchronize(PATIENT)).resolves.toEqual({
      patientId: 42,
      userId: 7,
    });

    await expect(
      database.getAllAsync('SELECT id, email, role FROM users ORDER BY id;'),
    ).resolves.toEqual([
      {
        email: 'patient@example.com',
        id: 7,
        role: 'PATIENT',
      },
    ]);
    await expect(
      database.getAllAsync('SELECT id, user_id, birth_date FROM patients ORDER BY id;'),
    ).resolves.toEqual([
      {
        birth_date: '1990-01-01',
        id: 42,
        user_id: 7,
      },
    ]);

    const seizures = new SeizureRepository({ databaseProvider: provider });
    const saved = await seizures.saveSeizure(
      new SeizureRecord({
        patientId: 42,
        occurredAt: '2026-10-25T12:00:00.000Z',
        occurrenceType: SeizureOccurrenceType.FOCAL,
        createdAt: NOW,
      }),
    );

    await expect(
      database.getFirstAsync('SELECT COUNT(*) AS count FROM seizure_records;'),
    ).resolves.toEqual({ count: 1 });
    expect(saved.patientId).toBe(42);
  });

  test('saves a treatment and its next reminders after identity synchronization', async () => {
    const identity = new LocalIdentityRepository({ databaseProvider: provider, now: () => NOW });

    await identity.synchronize(PATIENT);

    const treatments = new TreatmentRepository({
      databaseProvider: provider,
      now: () => NOW,
      timeZoneOffsetMinutes: 0,
    });
    const saved = await treatments.saveTreatmentWithReminders(
      new Treatment({
        patientId: 42,
        type: TreatmentType.MEDICATION,
        name: 'Levetiracetam',
        dailyFrequency: 2,
        baseTimes: ['08:00', '20:00'],
      }),
      { from: NOW, days: 1 },
    );

    await expect(
      database.getFirstAsync(
        'SELECT patient_id, daily_frequency FROM treatments WHERE id = ?;',
        saved.treatment.id,
      ),
    ).resolves.toEqual({ daily_frequency: 2, patient_id: 42 });
    await expect(
      database.getAllAsync(
        'SELECT scheduled_time FROM treatment_times WHERE treatment_id = ? ORDER BY scheduled_time;',
        saved.treatment.id,
      ),
    ).resolves.toEqual([{ scheduled_time: '08:00' }, { scheduled_time: '20:00' }]);
    await expect(
      database.getFirstAsync(
        'SELECT COUNT(*) AS count FROM reminders WHERE treatment_id = ?;',
        saved.treatment.id,
      ),
    ).resolves.toEqual({ count: 1 });
  });

  test('is idempotent and keeps professional identities out of the patient table', async () => {
    const identity = new LocalIdentityRepository({ databaseProvider: provider, now: () => NOW });

    await identity.synchronize(PATIENT);
    await identity.synchronize({ ...PATIENT, name: 'Nome Atualizado' });
    await identity.synchronize({
      id: 9,
      name: 'Profissional',
      email: 'professional@example.com',
      role: 'MEDIC_CARETAKER',
      medicCaretakerId: 3,
    });

    await expect(database.getFirstAsync('SELECT COUNT(*) AS count FROM users;')).resolves.toEqual({
      count: 2,
    });
    await expect(
      database.getFirstAsync('SELECT COUNT(*) AS count FROM patients;'),
    ).resolves.toEqual({ count: 1 });
    await expect(database.getFirstAsync('SELECT name FROM users WHERE id = 7;')).resolves.toEqual({
      name: 'Nome Atualizado',
    });
  });

  test('rolls back when a patient identity has no required birth date', async () => {
    const identity = new LocalIdentityRepository({ databaseProvider: provider, now: () => NOW });

    await expect(
      identity.synchronize({ ...PATIENT, id: 99, birthDate: undefined }),
    ).rejects.toThrow(/birthDate/);

    await expect(database.getFirstAsync('SELECT COUNT(*) AS count FROM users;')).resolves.toEqual({
      count: 0,
    });
  });
});
