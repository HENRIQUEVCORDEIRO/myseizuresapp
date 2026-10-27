import * as SecureStore from 'expo-secure-store';

export const SECURE_SESSION_KEY = 'myseizures.session.token.v1';

function requireSecureStore(secureStore) {
  for (const method of ['setItemAsync', 'getItemAsync', 'deleteItemAsync']) {
    if (typeof secureStore?.[method] !== 'function') {
      throw new TypeError(`Secure session storage must implement ${method}().`);
    }
  }

  return secureStore;
}

function requireSessionToken(session) {
  if (typeof session?.token !== 'string' || !session.token.trim()) {
    throw new TypeError('Session token must be a non-empty string.');
  }

  return session.token;
}

function requireCachedUser(user) {
  if (
    !user ||
    !Number.isInteger(user.id) ||
    user.id < 1 ||
    typeof user.name !== 'string' ||
    !user.name.trim() ||
    typeof user.role !== 'string' ||
    !user.role.trim()
  ) {
    throw new TypeError('Session user must contain an id, name, and role.');
  }

  const cached = {
    id: user.id,
    name: user.name.trim(),
    role: user.role,
  };
  const email = typeof user.email === 'string' && user.email.trim() ? user.email.trim() : null;
  const birthDate =
    typeof user.birthDate === 'string' && user.birthDate.trim() ? user.birthDate : null;

  if (email) cached.email = email;
  if (Number.isInteger(user.patientId) && user.patientId > 0) {
    cached.patientId = user.patientId;
    if (birthDate) cached.birthDate = birthDate;
    if (user.diagnosisDate === null || typeof user.diagnosisDate === 'string') {
      cached.diagnosisDate = user.diagnosisDate;
    }
  }
  if (Number.isInteger(user.medicCaretakerId) && user.medicCaretakerId > 0) {
    cached.medicCaretakerId = user.medicCaretakerId;
  }

  return cached;
}

function requireTokenExpiration(session) {
  if (!Number.isInteger(session?.tokenExpiresAt) || session.tokenExpiresAt < 1) {
    throw new TypeError('Session token expiration must be a positive Unix timestamp.');
  }

  return session.tokenExpiresAt;
}

function parseSession(value) {
  try {
    const session = JSON.parse(value);

    return {
      token: requireSessionToken(session),
      tokenExpiresAt: requireTokenExpiration(session),
      user: requireCachedUser(session.user),
    };
  } catch {
    return { token: value };
  }
}

export class SessionStore {
  constructor({ secureStore = SecureStore } = {}) {
    this.secureStore = requireSecureStore(secureStore);
  }

  async saveSession(session) {
    const serializedSession = JSON.stringify({
      token: requireSessionToken(session),
      tokenExpiresAt: requireTokenExpiration(session),
      user: requireCachedUser(session.user),
    });

    await this.secureStore.setItemAsync(SECURE_SESSION_KEY, serializedSession, {
      keychainAccessible: this.secureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
    });
  }

  async loadSession() {
    const token = await this.secureStore.getItemAsync(SECURE_SESSION_KEY);

    if (typeof token !== 'string' || !token.trim()) {
      return null;
    }

    return parseSession(token);
  }

  async clearSession() {
    await this.secureStore.deleteItemAsync(SECURE_SESSION_KEY);
  }
}
