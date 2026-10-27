import { Redirect } from 'expo-router';

import { ApplicationState } from '../components/index.js';
import { useAuthSession } from './AuthSessionProvider.js';
import { GuardDecision, resolveProtectedRoute } from './routePolicy.js';

export function ProtectedRoute({ allowedRoles, children }) {
  const { error, retry, status, user } = useAuthSession();
  const decision = resolveProtectedRoute({ allowedRoles, status, user });

  if (decision === GuardDecision.LOADING) {
    return <ApplicationState title="Carregando sua conta" variant="loading" />;
  }

  if (decision === GuardDecision.ERROR) {
    return (
      <ApplicationState
        actionHint="Tenta iniciar o aplicativo e restaurar a sessão novamente"
        actionLabel="Tentar novamente"
        message={error}
        onAction={retry}
        title="Não foi possível iniciar o MySeizures"
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
        message="Sua conta não tem permissão para abrir esta área."
        title="Acesso negado"
        variant="forbidden"
      />
    );
  }

  return children;
}
