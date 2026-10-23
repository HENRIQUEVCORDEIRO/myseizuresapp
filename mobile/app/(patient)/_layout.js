import { Stack } from 'expo-router';

import { UserRole } from '../../src/domain/value-objects/index.js';
import { ProtectedRoute } from '../../src/presentation/navigation/index.js';

/**
 * Patient area.
 *
 * The tab group is the root of this stack, so the tab bar stays visible while the entry screens
 * and the treatment editor are presented on top of it.
 */
export default function PatientLayout() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.PATIENT]}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="seizures/new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="triggers/new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="treatments/new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="treatments/[id]" />
        <Stack.Screen name="reminders" />
      </Stack>
    </ProtectedRoute>
  );
}
