import { AuthenticationPort, SessionStorePort } from '../ports/index.js';
import { UserRole } from '../../domain/value-objects/index.js';

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

function decodeTokenExpiration(token) {
  try {
    const payload = token.split('.')[1];

    if (!payload || typeof globalThis.atob !== 'function') {
      return null;
    }

    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = globalThis.atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='));
    const { exp } = JSON.parse(decoded);

    return Number.isInteger(exp) && exp > 0 ? exp : null;
  } catch {
    return null;
  }
}

function normalizeUser(user) {
  if (
    !user ||
    !Number.isInteger(user.id) ||
    user.id < 1 ||
    typeof user.name !== 'string' ||
    !user.name.trim() ||
    !Object.values(UserRole).includes(user.role)
  ) {
    throw new Error('Authentication adapter returned an invalid user.');
  }

  const patientId = user.patientId ?? user.id;

  if (user.role === UserRole.PATIENT && (!Number.isInteger(patientId) || patientId < 1)) {
    throw new Error('Authentication adapter returned an invalid patient identity.');
  }

  return {
    id: user.id,
    name: user.name.trim(),
    role: user.role,
    ...(user.role === UserRole.PATIENT ? { patientId } : {}),
  };
}

function normalizeSession(session) {
  if (!hasToken(session) || !session?.user) {
    throw new Error('Authentication adapter returned an invalid session.');
  }

  const tokenExpiresAt = decodeTokenExpiration(session.token);

  if (!tokenExpiresAt) {
    throw new Error('Authentication adapter returned a token without a valid expiration.');
  }

  return { token: session.token, tokenExpiresAt, user: normalizeUser(session.user) };
}

function isRejectedToken(error) {
  return error?.status === 401 && error?.code === 'UNAUTHENTICATED';
}

export class SignIn {
  constructor({ authentication, sessionStore, now = () => Date.now() }) {
    this.authentication = AuthenticationPort.assert(authentication);
    this.sessionStore = SessionStorePort.assert(sessionStore);

    if (typeof now !== 'function') {
      throw new TypeError('Authentication clock must be a function.');
    }

    this.now = now;
  }

  async execute(input) {
    const { email, password } = requireCredentials(input);
    const session = await this.authentication.authenticate(email, password);

    const normalizedSession = normalizeSession(session);

    await this.sessionStore.saveSession(normalizedSession);
    return normalizedSession;
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

    const tokenExpiresAt =
      storedSession.tokenExpiresAt ?? decodeTokenExpiration(storedSession.token);

    if (!Number.isInteger(tokenExpiresAt) || tokenExpiresAt <= Math.floor(this.now() / 1000)) {
      await this.sessionStore.clearSession();
      return null;
    }

    let cachedSession = null;

    try {
      cachedSession = storedSession.user
        ? { ...storedSession, tokenExpiresAt, user: normalizeUser(storedSession.user) }
        : null;
    } catch {
      cachedSession = null;
    }

    try {
      const user = await this.authentication.getCurrentUser(storedSession.token);
      const session = normalizeSession({ token: storedSession.token, user });

      await this.sessionStore.saveSession(session);
      return session;
    } catch (error) {
      if (isRejectedToken(error)) {
        await this.sessionStore.clearSession();
        return null;
      }

      if (error?.code === 'NETWORK_ERROR' && cachedSession) {
        return cachedSession;
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
