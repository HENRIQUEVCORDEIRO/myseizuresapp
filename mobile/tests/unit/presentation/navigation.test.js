import { UserRole } from '../../../src/domain/value-objects/index.js';
import {
  GuardDecision,
  destinationForRole,
  resolveProtectedRoute,
} from '../../../src/presentation/navigation/routePolicy.js';

describe('role-aware navigation policy', () => {
  test('blocks protected routes until session restoration finishes', () => {
    expect(resolveProtectedRoute({ status: 'loading' })).toBe(GuardDecision.LOADING);
    expect(resolveProtectedRoute({ status: 'error' })).toBe(GuardDecision.ERROR);
  });

  test('redirects unauthenticated users away from protected routes', () => {
    expect(resolveProtectedRoute({ status: 'unauthenticated', user: null })).toBe(
      GuardDecision.SIGN_IN,
    );
  });

  test('allows only roles declared by a protected route', () => {
    const patient = { id: 1, role: UserRole.PATIENT };

    expect(
      resolveProtectedRoute({
        status: 'authenticated',
        user: patient,
        allowedRoles: [UserRole.PATIENT],
      }),
    ).toBe(GuardDecision.ALLOW);
    expect(
      resolveProtectedRoute({
        status: 'authenticated',
        user: patient,
        allowedRoles: [UserRole.MEDIC_CARETAKER],
      }),
    ).toBe(GuardDecision.FORBIDDEN);
  });

  test('maps authenticated roles to their own route groups', () => {
    expect(destinationForRole(UserRole.PATIENT)).toBe('/(patient)');
    expect(destinationForRole(UserRole.MEDIC_CARETAKER)).toBe('/(professional)');
    expect(destinationForRole('UNKNOWN')).toBeNull();
  });
});
