import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { SignIn } from '../../src/application/use-cases/SignIn.js';
import { RestClientError } from '../../src/infrastructure/api/RestClient.js';
import {
  AuthSessionProvider,
  useAuthSession,
} from '../../src/presentation/navigation/AuthSessionProvider.js';

function tokenWithExpiration(exp = 2_000_000_000) {
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${encode({ alg: 'none' })}.${encode({ exp })}.signature`;
}

const cachedSession = {
  token: tokenWithExpiration(),
  tokenExpiresAt: 2_000_000_000,
  user: {
    id: 1,
    name: 'Demo Patient',
    email: 'patient@example.com',
    role: 'PATIENT',
    patientId: 1,
    birthDate: '1990-01-01',
    diagnosisDate: null,
  },
};

function SessionStatus() {
  const { status, user } = useAuthSession();

  return <Text>{`${status}:${user?.name ?? ''}`}</Text>;
}

describe('offline session bootstrap', () => {
  test('restores the cached patient when the profile request is offline', async () => {
    const authentication = {
      authenticate: jest.fn(),
      getCurrentUser: jest.fn().mockRejectedValue(
        new RestClientError({
          status: null,
          code: 'NETWORK_ERROR',
          message: 'Unable to reach the authentication service.',
        }),
      ),
      signOut: jest.fn(),
    };
    const sessionStore = {
      clearSession: jest.fn().mockResolvedValue(undefined),
      loadSession: jest.fn().mockResolvedValue(cachedSession),
      saveSession: jest.fn().mockResolvedValue(undefined),
    };
    const signIn = new SignIn({
      authentication,
      sessionStore,
      now: () => 1_000_000,
    });
    const synchronizeIdentity = jest.fn().mockResolvedValue(undefined);
    const container = {
      database: { initialize: jest.fn().mockResolvedValue(undefined) },
      signIn,
      synchronizeIdentity,
    };

    render(
      <AuthSessionProvider container={container}>
        <SessionStatus />
      </AuthSessionProvider>,
    );

    expect(await screen.findByText('authenticated:Demo Patient')).toBeOnTheScreen();
    expect(authentication.getCurrentUser).toHaveBeenCalledWith(cachedSession.token);
    expect(synchronizeIdentity).toHaveBeenCalledWith(cachedSession.user);
    expect(sessionStore.clearSession).not.toHaveBeenCalled();
  });
});
