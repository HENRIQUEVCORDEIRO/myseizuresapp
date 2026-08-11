import { Stack } from 'expo-router';

import { AuthSessionProvider } from '../src/presentation/navigation/index.js';

export default function RootLayout() {
  return (
    <AuthSessionProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthSessionProvider>
  );
}
