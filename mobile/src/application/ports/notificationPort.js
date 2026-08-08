import { definePort } from './definePort.js';

export const NotificationPort = definePort('NotificationPort', [
  'getPermissionStatus',
  'requestPermission',
  'scheduleMedicationReminder',
  'cancelScheduledReminder',
]);
