import { Redirect } from 'expo-router';

import { ApplicationState } from '../components/index.js';
import { useAuthSession } from './AuthSessionProvider.js';
import { GuardDecision, resolveProtectedRoute } from './routePolicy.js';

export function ProtectedRoute({ allowedRoles, children }) {
  const { error, retry, status, user } = useAuthSession();
  const decision = resolveProtectedRoute({ allowedRoles, status, user });

  if (decision === GuardDecision.LOADING) {
    return <ApplicationState title="Loading your account" variant="loading" />;
  }

  if (decision === GuardDecision.ERROR) {
    return (
      <ApplicationState
        actionHint="Retries application startup and session restoration"
        actionLabel="Try again"
        message={error}
        onAction={retry}
        title="Could not start MySeizures"
        variant="error"
      />
    );
  }

  if (decision === GuardDecision.SIGN_IN) {
    return <Redirect href="/(auth)" />;
  }

  if (decision === GuardDecision.FORBIDDEN) {
    return (
      <ApplicationState
        message="Your account does not have permission to open this area."
        title="Access denied"
        variant="forbidden"
      />
    );
  }

  return children;
}
