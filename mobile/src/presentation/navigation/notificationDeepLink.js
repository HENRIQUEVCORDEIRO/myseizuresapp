export function medicationReminderRoute(response) {
  const data = response?.notification?.request?.content?.data;
  if (
    data?.type !== 'MEDICATION_REMINDER' ||
    !Number.isInteger(data.reminderId) ||
    data.reminderId < 1
  )
    return null;
  return { pathname: '/(patient)/reminders', params: { reminderId: String(data.reminderId) } };
}

export function connectNotificationDeepLinks({ notifications, router }) {
  if (typeof notifications?.addNotificationResponseReceivedListener !== 'function')
    throw new TypeError('Notification response listener is required.');
  if (typeof router?.push !== 'function') throw new TypeError('Router push is required.');
  return notifications.addNotificationResponseReceivedListener((response) => {
    const route = medicationReminderRoute(response);
    if (route) router.push(route);
  });
}

export function NotificationDeepLinkHandler({ notifications = Notifications }) {
  const router = useRouter();
  useEffect(() => {
    const subscription = connectNotificationDeepLinks({ notifications, router });
    return () => subscription?.remove?.();
  }, [notifications, router]);
  return null;
}
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
