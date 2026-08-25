import * as Notifications from 'expo-notifications';

import { Reminder } from '../../domain/entities/index.js';

const REQUIRED_SCHEDULER_METHODS = Object.freeze([
  'getPermissionsAsync',
  'requestPermissionsAsync',
  'scheduleNotificationAsync',
  'cancelScheduledNotificationAsync',
]);

function requireScheduler(value) {
  const missingMethods = REQUIRED_SCHEDULER_METHODS.filter(
    (method) => typeof value?.[method] !== 'function',
  );

  if (missingMethods.length > 0) {
    throw new TypeError(`Notification scheduler is missing: ${missingMethods.join(', ')}.`);
  }

  return value;
}

function requirePersistedReminder(value) {
  if (!(value instanceof Reminder) || value.id === null) {
    throw new TypeError('Medication notification requires a persisted Reminder.');
  }

  return value;
}

function requireTreatmentName(value) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new TypeError('Medication notification requires a treatment name.');
  }

  return value.trim();
}

function requireNotificationId(value) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new TypeError('Notification id must be a non-empty string.');
  }

  return value;
}

export class ExpoNotificationService {
  constructor({ scheduler = Notifications, now = () => new Date().toISOString() } = {}) {
    this.scheduler = requireScheduler(scheduler);
    if (typeof now !== 'function') throw new TypeError('Notification clock must be a function.');
    this.now = now;
  }

  async getPermissionStatus() {
    const permission = await this.scheduler.getPermissionsAsync();
    return permission?.status ?? 'undetermined';
  }

  async requestPermission() {
    const permission = await this.scheduler.requestPermissionsAsync();
    return permission?.status ?? 'undetermined';
  }

  scheduleMedicationReminder({ reminder, treatmentName }) {
    const scheduledReminder = requirePersistedReminder(reminder);
    const medicationName = requireTreatmentName(treatmentName);

    return this.scheduler.scheduleNotificationAsync({
      content: {
        title: 'Medication reminder',
        body: `Time to take ${medicationName}.`,
        data: {
          type: 'MEDICATION_REMINDER',
          reminderId: scheduledReminder.id,
          treatmentId: scheduledReminder.treatmentId,
        },
      },
      trigger: new Date(scheduledReminder.scheduledAt),
    });
  }

  cancelScheduledReminder(notificationId) {
    return this.scheduler.cancelScheduledNotificationAsync(requireNotificationId(notificationId));
  }

  async deliverMedicationReminders({ treatmentName, reminders }) {
    if (!Array.isArray(reminders)) throw new TypeError('Medication reminders must be an array.');
    const medicationName = requireTreatmentName(treatmentName);
    let status = await this.getPermissionStatus();
    if (status === 'undetermined') status = await this.requestPermission();

    const now = this.now();
    const inApp = [];
    const scheduled = [];
    for (const reminder of reminders) {
      const item = requirePersistedReminder(reminder);
      if (status !== 'granted' || item.scheduledAt <= now) {
        inApp.push(item);
        continue;
      }
      try {
        const notificationId = await this.scheduleMedicationReminder({
          reminder: item,
          treatmentName: medicationName,
        });
        scheduled.push(Object.freeze({ reminder: item, notificationId }));
      } catch {
        inApp.push(item);
      }
    }
    return Object.freeze({
      permissionStatus: status,
      scheduled: Object.freeze(scheduled),
      inApp: Object.freeze(inApp),
    });
  }
}
