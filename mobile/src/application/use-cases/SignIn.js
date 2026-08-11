import { AuthenticationPort, SessionStorePort } from '../ports/index.js';

export class SignInInputError extends TypeError {
  constructor(message) {
    super(message);
    this.name = 'SignInInputError';
  }
}

function requireCredentials(input) {
  if (!input || typeof input.email !== 'string' || !input.email.trim()) {
    throw new SignInInputError('Email is required.');
  }

  if (typeof input.password !== 'string' || !input.password) {
    throw new SignInInputError('Password is required.');
  }

  return {
    email: input.email.trim().toLowerCase(),
    password: input.password,
  };
}

function hasToken(session) {
  return typeof session?.token === 'string' && Boolean(session.token.trim());
}

function isRejectedToken(error) {
  return error?.status === 401 && error?.code === 'UNAUTHENTICATED';
}

export class SignIn {
  constructor({ authentication, sessionStore }) {
    this.authentication = AuthenticationPort.assert(authentication);
    this.sessionStore = SessionStorePort.assert(sessionStore);
  }

  async execute(input) {
    const { email, password } = requireCredentials(input);
    const session = await this.authentication.authenticate(email, password);

    if (!hasToken(session) || !session.user) {
      throw new Error('Authentication adapter returned an invalid session.');
    }

    await this.sessionStore.saveSession(session);
    return session;
  }

  async restoreSession() {
    const storedSession = await this.sessionStore.loadSession();

    if (!storedSession) {
      return null;
    }

    if (!hasToken(storedSession)) {
      await this.sessionStore.clearSession();
      return null;
    }

    try {
      const user = await this.authentication.getCurrentUser(storedSession.token);
      const session = { token: storedSession.token, user };

      await this.sessionStore.saveSession(session);
      return session;
    } catch (error) {
      if (isRejectedToken(error)) {
        await this.sessionStore.clearSession();
        return null;
      }

      throw error;
    }
  }

  async signOut() {
    try {
      await this.authentication.signOut();
    } finally {
      await this.sessionStore.clearSession();
    }
  }
}
