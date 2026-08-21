import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';

import { Adherence, Reminder, Treatment } from '../../src/domain/entities/index.js';
import {
  ConsumptionStatus,
  ReminderStatus,
  TreatmentType,
} from '../../src/domain/value-objects/index.js';
import { TreatmentRepository } from '../../src/infrastructure/persistence/repositories/TreatmentRepository.js';
import { DatabaseProvider } from '../../src/infrastructure/persistence/sqlite/DatabaseProvider.js';
import { createSQLiteTestDatabase } from '../unit/factories/sqliteTestDatabase.js';

const NOW = '2026-08-20T12:00:00.000Z';

function createTreatment(overrides = {}) {
  return new Treatment({
    patientId: 1,
    type: TreatmentType.MEDICATION,
    name: 'Levetiracetam',
    dailyFrequency: 2,
    baseTimes: ['08:00', '20:00'],
    ...overrides,
  });
}

function createReminder(treatmentId, scheduledAt) {
  return new Reminder({ treatmentId, scheduledAt });
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

async function seedPatient(database) {
  await database.runAsync(
    `INSERT INTO users (id, name, email, password_hash, role, created_at)
     VALUES (1, 'Patient', 'patient@example.test', 'test-hash', 'PATIENT', $createdAt);`,
    { $createdAt: NOW },
  );
  await database.runAsync(
    `INSERT INTO patients (id, user_id, birth_date, diagnosis_date)
     VALUES (1, 1, '1980-01-01', NULL);`,
  );
}

async function readReminders(database, treatmentId) {
  return database.getAllAsync(
    `SELECT id, treatment_id, scheduled_at, status
     FROM reminders
     WHERE treatment_id = $treatmentId
     ORDER BY scheduled_at ASC, id ASC;`,
    { $treatmentId: treatmentId },
  );
}

function removeTemporaryDirectory(directory) {
  const temporaryRoot = resolve(tmpdir());
  const target = resolve(directory);
  const pathFromRoot = relative(temporaryRoot, target);

  if (
    !pathFromRoot ||
    pathFromRoot.startsWith('..') ||
    resolve(temporaryRoot, pathFromRoot) !== target
  ) {
    throw new Error('Refusing to remove a directory outside the operating-system temp folder.');
  }

  rmSync(target, { force: true, recursive: true });
}

describe('treatment SQLite repository transactions', () => {
  let database;
  let repository;
  let temporaryDirectory;

  beforeEach(async () => {
    temporaryDirectory = mkdtempSync(join(tmpdir(), 'myseizures-treatment-repository-'));
    const databasePath = join(temporaryDirectory, 'treatments.db');
    const initialized = await createProvider(databasePath);
    database = initialized.database;
    repository = new TreatmentRepository({
      databaseProvider: initialized.provider,
      now: () => NOW,
    });
    await seedPatient(database);
  });

  afterEach(async () => {
    await database?.closeAsync();
    removeTemporaryDirectory(temporaryDirectory);
  });

  test('persists a treatment and all base times in one transaction', async () => {
    const saved = await repository.saveTreatment(createTreatment());

    await expect(
      database.getFirstAsync(
        `SELECT patient_id, type, name, daily_frequency, active
         FROM treatments
         WHERE id = $treatmentId;`,
        { $treatmentId: saved.id },
      ),
    ).resolves.toEqual({
      patient_id: 1,
      type: TreatmentType.MEDICATION,
      name: 'Levetiracetam',
      daily_frequency: 2,
      active: 1,
    });
    await expect(
      database.getAllAsync(
        `SELECT scheduled_time
         FROM treatment_times
         WHERE treatment_id = $treatmentId
         ORDER BY scheduled_time ASC;`,
        { $treatmentId: saved.id },
      ),
    ).resolves.toEqual([{ scheduled_time: '08:00' }, { scheduled_time: '20:00' }]);
  });

  test('an edit replaces only future scheduled reminders and preserves confirmations', async () => {
    const saved = await repository.saveTreatment(createTreatment());
    const initial = await repository.replaceFutureReminders(
      1,
      saved.id,
      '2026-08-01T00:00:00.000Z',
      [
        createReminder(saved.id, '2026-08-19T08:00:00.000Z'),
        createReminder(saved.id, '2026-08-21T08:00:00.000Z'),
        createReminder(saved.id, '2026-08-21T20:00:00.000Z'),
      ],
    );
    const confirmed = initial[2];
    const adherence = new Adherence({
      reminderId: confirmed.id,
      confirmedAt: NOW,
      consumptionStatus: ConsumptionStatus.TAKEN,
    });

    await database.runAsync(`UPDATE reminders SET status = $status WHERE id = $reminderId;`, {
      $status: ReminderStatus.TAKEN,
      $reminderId: confirmed.id,
    });
    await database.runAsync(
      `INSERT INTO adherence (reminder_id, confirmed_at, consumption_status)
       VALUES ($reminderId, $confirmedAt, $consumptionStatus);`,
      {
        $reminderId: adherence.reminderId,
        $confirmedAt: adherence.confirmedAt,
        $consumptionStatus: adherence.consumptionStatus,
      },
    );

    await repository.saveTreatment(
      createTreatment({
        id: saved.id,
        name: 'Levetiracetam XR',
        dailyFrequency: 1,
        baseTimes: ['09:00'],
      }),
    );
    await repository.replaceFutureReminders(1, saved.id, NOW, [
      createReminder(saved.id, '2026-08-22T09:00:00.000Z'),
    ]);

    expect(await readReminders(database, saved.id)).toEqual([
      {
        id: initial[0].id,
        treatment_id: saved.id,
        scheduled_at: '2026-08-19T08:00:00.000Z',
        status: ReminderStatus.SCHEDULED,
      },
      {
        id: confirmed.id,
        treatment_id: saved.id,
        scheduled_at: '2026-08-21T20:00:00.000Z',
        status: ReminderStatus.TAKEN,
      },
      {
        id: expect.any(Number),
        treatment_id: saved.id,
        scheduled_at: '2026-08-22T09:00:00.000Z',
        status: ReminderStatus.SCHEDULED,
      },
    ]);
    await expect(
      database.getFirstAsync(
        `SELECT reminder_id, confirmed_at, consumption_status
         FROM adherence
         WHERE reminder_id = $reminderId;`,
        { $reminderId: confirmed.id },
      ),
    ).resolves.toEqual({
      reminder_id: confirmed.id,
      confirmed_at: NOW,
      consumption_status: ConsumptionStatus.TAKEN,
    });
  });

  test('rolls back deletion when a future-reminder replacement cannot be inserted', async () => {
    const saved = await repository.saveTreatment(createTreatment());
    const [original] = await repository.replaceFutureReminders(1, saved.id, NOW, [
      createReminder(saved.id, '2026-08-21T08:00:00.000Z'),
    ]);
    const duplicateTime = '2026-08-22T08:00:00.000Z';

    await expect(
      repository.replaceFutureReminders(1, saved.id, NOW, [
        createReminder(saved.id, duplicateTime),
        createReminder(saved.id, duplicateTime),
      ]),
    ).rejects.toThrow();

    await expect(readReminders(database, saved.id)).resolves.toEqual([
      {
        id: original.id,
        treatment_id: saved.id,
        scheduled_at: original.scheduledAt,
        status: ReminderStatus.SCHEDULED,
      },
    ]);
  });

  test('does not replace reminders through another patient scope', async () => {
    const saved = await repository.saveTreatment(createTreatment());
    const [original] = await repository.replaceFutureReminders(1, saved.id, NOW, [
      createReminder(saved.id, '2026-08-21T08:00:00.000Z'),
    ]);

    await expect(repository.replaceFutureReminders(2, saved.id, NOW, [])).rejects.toThrow(
      /not found for this patient/,
    );
    await expect(readReminders(database, saved.id)).resolves.toEqual([
      {
        id: original.id,
        treatment_id: saved.id,
        scheduled_at: original.scheduledAt,
        status: ReminderStatus.SCHEDULED,
      },
    ]);
  });
});
