import { Stack } from 'expo-router';

import { AuthRoute } from '../../src/presentation/navigation/index.js';

export default function AuthLayout() {
  return (
    <AuthRoute>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthRoute>
  );
}
