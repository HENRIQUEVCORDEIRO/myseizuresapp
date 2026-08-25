import { Stack } from 'expo-router';

import {
  AuthSessionProvider,
  NotificationDeepLinkHandler,
} from '../src/presentation/navigation/index.js';

export default function RootLayout() {
  return (
    <AuthSessionProvider>
      <NotificationDeepLinkHandler />
      <Stack screenOptions={{ headerShown: false }} />
    </AuthSessionProvider>
  );
}
