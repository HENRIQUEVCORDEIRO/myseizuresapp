import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';

import { Adherence, Reminder, Treatment } from '../../src/domain/entities/index.js';
import { TreatmentRepositoryPort } from '../../src/application/ports/index.js';
import {
  ConsumptionStatus,
  ReminderStatus,
  TreatmentType,
} from '../../src/domain/value-objects/index.js';
import {
  FinalConfirmationError,
  TreatmentRepository,
} from '../../src/infrastructure/persistence/repositories/TreatmentRepository.js';
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
  for (const patientId of [1, 2]) {
    await database.runAsync(
      `INSERT INTO users (id, name, email, password_hash, role, created_at)
       VALUES ($patientId, $name, $email, $passwordHash, 'PATIENT', $createdAt);`,
      {
        $patientId: patientId,
        $name: `Patient ${patientId}`,
        $email: `patient${patientId}@example.test`,
        $passwordHash: `test-hash-${patientId}`,
        $createdAt: NOW,
      },
    );
    await database.runAsync(
      `INSERT INTO patients (id, user_id, birth_date, diagnosis_date)
       VALUES ($patientId, $patientId, '1980-01-01', NULL);`,
      { $patientId: patientId },
    );
  }
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

  test('implements the complete treatment repository port', () => {
    expect(TreatmentRepositoryPort.assert(repository)).toBe(repository);
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

  test('finds and lists complete treatments only within the patient scope', async () => {
    const active = await repository.saveTreatment(createTreatment({ name: 'Active treatment' }));
    const inactive = await repository.saveTreatment(
      createTreatment({
        name: 'Inactive treatment',
        active: false,
        dailyFrequency: 1,
        baseTimes: ['12:00'],
      }),
    );
    await repository.saveTreatment(createTreatment({ patientId: 2, name: 'Other patient' }));

    await expect(repository.findTreatmentById(1, active.id)).resolves.toEqual(active);
    await expect(repository.findTreatmentById(2, active.id)).resolves.toBeNull();
    await expect(repository.listTreatmentsByPatient(1)).resolves.toEqual([active, inactive]);
    await expect(repository.listTreatmentsByPatient(1, { active: true })).resolves.toEqual([
      active,
    ]);
    await expect(repository.listTreatmentsByPatient(2)).resolves.toHaveLength(1);
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

  test('finds reminders only through their owning patient', async () => {
    const treatment = await repository.saveTreatment(createTreatment());
    const [reminder] = await repository.replaceFutureReminders(1, treatment.id, NOW, [
      createReminder(treatment.id, '2026-08-21T08:00:00.000Z'),
    ]);

    await expect(repository.findReminderById(1, reminder.id)).resolves.toEqual(reminder);
    await expect(repository.findReminderById(2, reminder.id)).resolves.toBeNull();
  });

  test('saves one final confirmation atomically and treats an identical retry as idempotent', async () => {
    const treatment = await repository.saveTreatment(createTreatment());
    const [reminder] = await repository.replaceFutureReminders(1, treatment.id, NOW, [
      createReminder(treatment.id, '2026-08-21T08:00:00.000Z'),
    ]);
    const confirmation = new Adherence({
      reminderId: reminder.id,
      confirmedAt: NOW,
      consumptionStatus: ConsumptionStatus.TAKEN,
    });

    const saved = await repository.saveAdherence(1, confirmation);
    const retry = await repository.saveAdherence(
      1,
      new Adherence({
        reminderId: reminder.id,
        confirmedAt: '2026-08-20T12:01:00.000Z',
        consumptionStatus: ConsumptionStatus.TAKEN,
      }),
    );

    expect(saved).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        reminderId: confirmation.reminderId,
        confirmedAt: confirmation.confirmedAt,
        consumptionStatus: confirmation.consumptionStatus,
      }),
    );
    expect(retry).toEqual(saved);
    await expect(repository.findReminderById(1, reminder.id)).resolves.toEqual(
      new Reminder({ ...reminder, status: ReminderStatus.TAKEN }),
    );
    await expect(
      database.getFirstAsync(
        `SELECT COUNT(*) AS confirmation_count
         FROM adherence
         WHERE reminder_id = $reminderId;`,
        { $reminderId: reminder.id },
      ),
    ).resolves.toEqual({ confirmation_count: 1 });
  });

  test('rejects cross-patient and conflicting final confirmations without changing history', async () => {
    const treatment = await repository.saveTreatment(createTreatment());
    const [reminder] = await repository.replaceFutureReminders(1, treatment.id, NOW, [
      createReminder(treatment.id, '2026-08-21T08:00:00.000Z'),
    ]);
    const taken = new Adherence({
      reminderId: reminder.id,
      confirmedAt: NOW,
      consumptionStatus: ConsumptionStatus.TAKEN,
    });

    await expect(repository.saveAdherence(2, taken)).rejects.toThrow(/not found for this patient/);
    const saved = await repository.saveAdherence(1, taken);
    await expect(
      repository.saveAdherence(
        1,
        new Adherence({
          reminderId: reminder.id,
          confirmedAt: NOW,
          consumptionStatus: ConsumptionStatus.MISSED,
        }),
      ),
    ).rejects.toBeInstanceOf(FinalConfirmationError);
    await expect(
      repository.listAdherenceByPeriod(1, {
        periodStart: '2026-08-20T00:00:00.000Z',
        periodEnd: '2026-08-20T23:59:59.999Z',
      }),
    ).resolves.toEqual([saved]);
  });

  test('lists final confirmations within an inclusive period and patient scope', async () => {
    const treatment = await repository.saveTreatment(createTreatment());
    const reminders = await repository.replaceFutureReminders(
      1,
      treatment.id,
      '2026-08-20T00:00:00.000Z',
      [
        createReminder(treatment.id, '2026-08-20T08:00:00.000Z'),
        createReminder(treatment.id, '2026-08-20T20:00:00.000Z'),
      ],
    );
    const otherTreatment = await repository.saveTreatment(createTreatment({ patientId: 2 }));
    const [otherReminder] = await repository.replaceFutureReminders(
      2,
      otherTreatment.id,
      '2026-08-20T00:00:00.000Z',
      [createReminder(otherTreatment.id, '2026-08-20T09:00:00.000Z')],
    );
    const period = {
      periodStart: '2026-08-20T10:00:00.000Z',
      periodEnd: '2026-08-20T12:00:00.000Z',
    };
    const first = await repository.saveAdherence(
      1,
      new Adherence({
        reminderId: reminders[0].id,
        confirmedAt: period.periodStart,
        consumptionStatus: ConsumptionStatus.TAKEN,
      }),
    );
    const last = await repository.saveAdherence(
      1,
      new Adherence({
        reminderId: reminders[1].id,
        confirmedAt: period.periodEnd,
        consumptionStatus: ConsumptionStatus.MISSED,
      }),
    );
    await repository.saveAdherence(
      2,
      new Adherence({
        reminderId: otherReminder.id,
        confirmedAt: '2026-08-20T11:00:00.000Z',
        consumptionStatus: ConsumptionStatus.TAKEN,
      }),
    );

    await expect(repository.listAdherenceByPeriod(1, period)).resolves.toEqual([first, last]);
    await expect(repository.listAdherenceByPeriod(2, period)).resolves.toHaveLength(1);
  });
});
