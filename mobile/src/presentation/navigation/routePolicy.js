import { UserRole } from '../../domain/value-objects/index.js';

export const GuardDecision = Object.freeze({
  ALLOW: 'ALLOW',
  ERROR: 'ERROR',
  FORBIDDEN: 'FORBIDDEN',
  LOADING: 'LOADING',
  SIGN_IN: 'SIGN_IN',
});

export function resolveProtectedRoute({ status, user, allowedRoles = [] }) {
  if (status === 'loading') {
    return GuardDecision.LOADING;
  }

  if (status === 'error') {
    return GuardDecision.ERROR;
  }

  if (status !== 'authenticated' || !user) {
    return GuardDecision.SIGN_IN;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return GuardDecision.FORBIDDEN;
  }

  return GuardDecision.ALLOW;
}

export function destinationForRole(role) {
  if (role === UserRole.PATIENT) {
    return '/(patient)';
  }

  if (role === UserRole.MEDIC_CARETAKER) {
    return '/(professional)';
  }

  return null;
}
