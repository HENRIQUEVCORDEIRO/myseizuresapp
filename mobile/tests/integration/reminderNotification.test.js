import { Reminder, Treatment } from '../../src/domain/entities/index.js';
import { generateReminderSchedule } from '../../src/domain/rules/index.js';
import { TreatmentType } from '../../src/domain/value-objects/index.js';
import { NotificationPort } from '../../src/application/ports/index.js';
import { ExpoNotificationService } from '../../src/infrastructure/notifications/ExpoNotificationService.js';

const NOW = '2026-08-20T12:00:00.000Z';

class FakeNotificationScheduler {
  constructor() {
    this.nextId = 1;
    this.scheduled = new Map();
    this.cancelled = [];
  }

  async getPermissionsAsync() {
    return { status: 'granted' };
  }

  async requestPermissionsAsync() {
    return { status: 'granted' };
  }

  async scheduleNotificationAsync(request) {
    const id = `notification-${this.nextId}`;
    this.nextId += 1;
    this.scheduled.set(id, request);
    return id;
  }

  async cancelScheduledNotificationAsync(id) {
    this.cancelled.push(id);
    this.scheduled.delete(id);
  }
}

function createTreatment(overrides = {}) {
  return new Treatment({
    id: 11,
    patientId: 7,
    type: TreatmentType.MEDICATION,
    name: 'Levetiracetam',
    dailyFrequency: 2,
    baseTimes: ['08:00', '20:00'],
    ...overrides,
  });
}

function persistGeneratedReminders(reminders, firstId = 101) {
  return reminders.map(
    (reminder, index) =>
      new Reminder({
        ...reminder,
        id: firstId + index,
      }),
  );
}

async function scheduleAll(service, treatment, reminders) {
  return Promise.all(
    reminders.map((reminder) =>
      service.scheduleMedicationReminder({
        reminder,
        treatmentName: treatment.name,
      }),
    ),
  );
}

describe('medication reminder notification adapter', () => {
  let scheduler;
  let service;

  beforeEach(() => {
    scheduler = new FakeNotificationScheduler();
    service = new ExpoNotificationService({ scheduler });
  });

  test('implements the notification application port', () => {
    expect(NotificationPort.assert(service)).toBe(service);
  });

  test('a created treatment schedules every expected future reminder', async () => {
    const treatment = createTreatment();
    const reminders = persistGeneratedReminders(
      generateReminderSchedule({ treatment, from: NOW, days: 2 }),
    );

    const notificationIds = await scheduleAll(service, treatment, reminders);

    expect(notificationIds).toEqual(['notification-1', 'notification-2', 'notification-3']);
    expect([...scheduler.scheduled.values()]).toEqual(
      reminders.map((reminder) => ({
        content: {
          title: 'Medication reminder',
          body: 'Time to take Levetiracetam.',
          data: {
            type: 'MEDICATION_REMINDER',
            reminderId: reminder.id,
            treatmentId: treatment.id,
          },
        },
        trigger: new Date(reminder.scheduledAt),
      })),
    );
  });

  test('an edited treatment cancels obsolete notifications and schedules its new times', async () => {
    const originalTreatment = createTreatment();
    const originalReminders = persistGeneratedReminders(
      generateReminderSchedule({ treatment: originalTreatment, from: NOW, days: 2 }),
    );
    const originalNotificationIds = await scheduleAll(
      service,
      originalTreatment,
      originalReminders,
    );
    const editedTreatment = createTreatment({
      name: 'Levetiracetam XR',
      dailyFrequency: 1,
      baseTimes: ['09:00'],
    });
    const editedReminders = persistGeneratedReminders(
      generateReminderSchedule({ treatment: editedTreatment, from: NOW, days: 2 }),
      201,
    );

    await Promise.all(
      originalNotificationIds.map((notificationId) =>
        service.cancelScheduledReminder(notificationId),
      ),
    );
    const editedNotificationIds = await scheduleAll(service, editedTreatment, editedReminders);

    expect(scheduler.cancelled).toEqual(originalNotificationIds);
    expect(editedNotificationIds).toEqual(['notification-4']);
    expect([...scheduler.scheduled.entries()]).toEqual([
      [
        'notification-4',
        {
          content: {
            title: 'Medication reminder',
            body: 'Time to take Levetiracetam XR.',
            data: {
              type: 'MEDICATION_REMINDER',
              reminderId: 201,
              treatmentId: editedTreatment.id,
            },
          },
          trigger: new Date('2026-08-21T09:00:00.000Z'),
        },
      ],
    ]);
  });

  test('rejects unsaved reminders before reaching the platform scheduler', async () => {
    const unsavedReminder = new Reminder({
      treatmentId: 11,
      scheduledAt: '2026-08-20T20:00:00.000Z',
    });

    expect(() =>
      service.scheduleMedicationReminder({
        reminder: unsavedReminder,
        treatmentName: 'Levetiracetam',
      }),
    ).toThrow(/persisted Reminder/);
    expect(scheduler.scheduled.size).toBe(0);
  });

  test('denied permission and overdue doses remain actionable in the app', async () => {
    scheduler.getPermissionsAsync = jest.fn().mockResolvedValue({ status: 'denied' });
    const reminders = persistGeneratedReminders(
      generateReminderSchedule({ treatment: createTreatment(), from: NOW, days: 2 }),
    );
    const result = await service.deliverMedicationReminders({
      treatmentName: 'Levetiracetam',
      reminders,
    });
    expect(result.permissionStatus).toBe('denied');
    expect(result.scheduled).toEqual([]);
    expect(result.inApp).toEqual(reminders);
    expect(scheduler.scheduled.size).toBe(0);
  });
});
