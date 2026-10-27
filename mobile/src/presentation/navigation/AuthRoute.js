import { Redirect } from 'expo-router';

import { ApplicationState } from '../components/index.js';
import { useAuthSession } from './AuthSessionProvider.js';
import { destinationForRole } from './routePolicy.js';

export function AuthRoute({ children }) {
  const { error, retry, status, user } = useAuthSession();

  if (status === 'loading') {
    return <ApplicationState title="Carregando sua conta" variant="loading" />;
  }

  if (status === 'error') {
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

  if (status === 'authenticated') {
    const destination = destinationForRole(user?.role);

    if (destination) {
      return <Redirect href={destination} />;
    }

    return (
      <ApplicationState
        message="Esta conta tem um perfil não suportado."
        title="Acesso negado"
        variant="forbidden"
      />
    );
  }

  return children;
}
