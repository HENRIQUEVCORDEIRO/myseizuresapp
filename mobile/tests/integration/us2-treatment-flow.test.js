import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  ConfirmDose,
  ListReminders,
  ManageTreatment,
} from '../../src/application/use-cases/treatment/index.js';
import { ConsumptionStatus, TreatmentType } from '../../src/domain/value-objects/index.js';
import { ExpoNotificationService } from '../../src/infrastructure/notifications/ExpoNotificationService.js';
import { TreatmentRepository } from '../../src/infrastructure/persistence/repositories/index.js';
import { DatabaseProvider } from '../../src/infrastructure/persistence/sqlite/DatabaseProvider.js';
import { medicationReminderRoute } from '../../src/presentation/navigation/notificationDeepLink.js';
import { createSQLiteTestDatabase } from '../unit/factories/sqliteTestDatabase.js';

const BOUNDARY = '2026-08-20T00:00:00.000Z';
const CONFIRMED_AT = '2026-08-20T21:00:00.000Z';

test('patient creates a schedule, uses denied-permission fallback, and confirms each dose once', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'myseizures-us2-'));
  const database = createSQLiteTestDatabase(join(directory, 'care.db'));
  const provider = new DatabaseProvider({
    databaseName: 'care.db',
    openDatabase: jest.fn().mockResolvedValue(database),
  });
  try {
    await provider.initialize();
    await database.runAsync(
      `INSERT INTO users (id, name, email, password_hash, role, created_at) VALUES (1, 'Patient', 'patient@example.test', 'hash', 'PATIENT', $now);`,
      { $now: BOUNDARY },
    );
    await database.runAsync(
      `INSERT INTO patients (id, user_id, birth_date, diagnosis_date) VALUES (1, 1, '1980-01-01', NULL);`,
    );
    const repository = new TreatmentRepository({ databaseProvider: provider, now: () => BOUNDARY });
    const scheduler = {
      getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'denied' }),
      requestPermissionsAsync: jest.fn(),
      scheduleNotificationAsync: jest.fn(),
      cancelScheduledNotificationAsync: jest.fn(),
    };
    const notifications = new ExpoNotificationService({ scheduler, now: () => BOUNDARY });
    const options = {
      treatmentRepository: repository,
      getActivePatientId: () => 1,
      now: () => BOUNDARY,
    };
    const manage = new ManageTreatment({ ...options, notifications, scheduleDays: 1 });
    const list = new ListReminders(options);
    const confirm = new ConfirmDose({ ...options, now: () => CONFIRMED_AT });

    const created = await manage.execute({
      type: TreatmentType.MEDICATION,
      name: 'Levetiracetam',
      dailyFrequency: 2,
      baseTimes: ['08:00', '20:00'],
    });
    expect(created.reminders).toHaveLength(2);
    expect(created.delivery.inApp).toEqual(created.reminders);
    expect(await list.execute()).toEqual(created.reminders);
    expect(
      medicationReminderRoute({
        notification: {
          request: {
            content: { data: { type: 'MEDICATION_REMINDER', reminderId: created.reminders[0].id } },
          },
        },
      }),
    ).toEqual({
      pathname: '/(patient)/reminders',
      params: { reminderId: String(created.reminders[0].id) },
    });

    await confirm.execute({
      reminderId: created.reminders[0].id,
      consumptionStatus: ConsumptionStatus.TAKEN,
    });
    await confirm.execute({
      reminderId: created.reminders[1].id,
      consumptionStatus: ConsumptionStatus.MISSED,
    });
    await expect(
      confirm.execute({
        reminderId: created.reminders[0].id,
        consumptionStatus: ConsumptionStatus.MISSED,
      }),
    ).rejects.toThrow(/final/i);
    await expect(
      repository.listAdherenceByPeriod(1, {
        periodStart: BOUNDARY,
        periodEnd: '2026-08-20T23:59:59.999Z',
      }),
    ).resolves.toHaveLength(2);
    await expect(list.execute()).resolves.toEqual([]);
  } finally {
    await database.closeAsync();
    rmSync(directory, { recursive: true, force: true });
  }
});
