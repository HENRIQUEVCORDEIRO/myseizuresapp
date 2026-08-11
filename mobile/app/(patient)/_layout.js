import { Stack } from 'expo-router';

import { UserRole } from '../../src/domain/value-objects/index.js';
import { ProtectedRoute } from '../../src/presentation/navigation/index.js';

export default function PatientLayout() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.PATIENT]}>
      <Stack screenOptions={{ headerShown: false }} />
    </ProtectedRoute>
  );
}
