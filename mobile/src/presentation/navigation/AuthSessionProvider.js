import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { getContainer } from '../../composition/container.js';

const AuthSessionContext = createContext(null);

function messageFrom(error) {
  return error?.message || 'The application could not restore your session.';
}

export function AuthSessionProvider({ children, container: suppliedContainer }) {
  const container = useMemo(() => suppliedContainer ?? getContainer(), [suppliedContainer]);
  const [state, setState] = useState({ error: null, session: null, status: 'loading' });

  const bootstrap = useCallback(async () => {
    setState({ error: null, session: null, status: 'loading' });

    try {
      await container.database.initialize();
      const session = await container.signIn.restoreSession();
      setState({
        error: null,
        session,
        status: session ? 'authenticated' : 'unauthenticated',
      });
    } catch (error) {
      setState({ error: messageFrom(error), session: null, status: 'error' });
    }
  }, [container]);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const signIn = useCallback(
    async (credentials) => {
      const session = await container.signIn.execute(credentials);
      setState({ error: null, session, status: 'authenticated' });
      return session;
    },
    [container],
  );

  const signOut = useCallback(async () => {
    try {
      await container.signIn.signOut();
    } finally {
      setState({ error: null, session: null, status: 'unauthenticated' });
    }
  }, [container]);

  const value = useMemo(
    () => ({
      ...state,
      retry: bootstrap,
      signIn,
      signOut,
      user: state.session?.user ?? null,
    }),
    [bootstrap, signIn, signOut, state],
  );

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}

export function useAuthSession() {
  const session = useContext(AuthSessionContext);

  if (!session) {
    throw new Error('useAuthSession must be used inside AuthSessionProvider.');
  }

  return session;
}
