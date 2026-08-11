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

export class SessionStore {
  constructor({ secureStore = SecureStore } = {}) {
    this.secureStore = requireSecureStore(secureStore);
  }

  async saveSession(session) {
    await this.secureStore.setItemAsync(SECURE_SESSION_KEY, requireSessionToken(session), {
      keychainAccessible: this.secureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
    });
  }

  async loadSession() {
    const token = await this.secureStore.getItemAsync(SECURE_SESSION_KEY);

    if (typeof token !== 'string' || !token.trim()) {
      return null;
    }

    return { token };
  }

  async clearSession() {
    await this.secureStore.deleteItemAsync(SECURE_SESSION_KEY);
  }
}
