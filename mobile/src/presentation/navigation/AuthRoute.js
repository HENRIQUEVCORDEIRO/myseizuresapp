import { Redirect } from 'expo-router';

import { ApplicationState } from '../components/index.js';
import { useAuthSession } from './AuthSessionProvider.js';
import { destinationForRole } from './routePolicy.js';

export function AuthRoute({ children }) {
  const { error, retry, status, user } = useAuthSession();

  if (status === 'loading') {
    return <ApplicationState title="Loading your account" variant="loading" />;
  }

  if (status === 'error') {
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

  if (status === 'authenticated') {
    const destination = destinationForRole(user?.role);

    if (destination) {
      return <Redirect href={destination} />;
    }

    return (
      <ApplicationState
        message="This account has an unsupported role."
        title="Access denied"
        variant="forbidden"
      />
    );
  }

  return children;
}
