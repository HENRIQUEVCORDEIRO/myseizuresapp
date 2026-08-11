import { createHmac, scryptSync, timingSafeEqual } from 'node:crypto';

const TOKEN_HEADER = Object.freeze({ alg: 'HS256', typ: 'JWT' });
const MINIMUM_SECRET_BYTES = 32;
const DEFAULT_TOKEN_TTL_SECONDS = 60 * 60;

export const UserRole = Object.freeze({
  PATIENT: 'PATIENT',
  MEDIC_CARETAKER: 'MEDIC_CARETAKER',
});

export const seededUsers = Object.freeze([
  Object.freeze({
    id: 1,
    name: 'Demo Patient',
    email: 'patient@example.com',
    passwordHash:
      'scrypt$myseizures-demo-patient-v1$be49f7545cd9bfa95c42e443f3b5fa11abffa7fedce8fcc7bdd784b4b9be7e75e2af1c867cc4b63a81ac0824c09634172f0ab8f0288f37946b3980b154c6b2eb',
    role: UserRole.PATIENT,
    patientId: 1,
  }),
  Object.freeze({
    id: 2,
    name: 'Demo Professional',
    email: 'professional@example.com',
    passwordHash:
      'scrypt$myseizures-demo-professional-v1$f418cb0b2c2bc1578235f05bd77b8b42b5ecd2dbaa9d90a80fc926104fe9fa4bb69bc27a2c6c8b7c88db065b6ae9c9d7b773f2d6041e306a16690c5f7b018c3a',
    role: UserRole.MEDIC_CARETAKER,
    medicCaretakerId: 1,
  }),
]);

const DUMMY_PASSWORD_HASH = seededUsers[0].passwordHash;

function encodeJson(value) {
  return Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');
}

function signValue(value, secret) {
  return createHmac('sha256', secret).update(value).digest('base64url');
}

function signaturesMatch(actual, expected) {
  const actualBytes = Buffer.from(actual, 'utf8');
  const expectedBytes = Buffer.from(expected, 'utf8');

  return actualBytes.length === expectedBytes.length && timingSafeEqual(actualBytes, expectedBytes);
}

function verifyPassword(password, encodedHash) {
  const [algorithm, salt, expectedHex] = encodedHash.split('$');

  if (algorithm !== 'scrypt' || !salt || !expectedHex) {
    return false;
  }

  const expected = Buffer.from(expectedHex, 'hex');
  const actual = scryptSync(password, salt, expected.length);

  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    role: user.role,
  };
}

function authenticatedUser(user) {
  return {
    ...publicUser(user),
    ...(user.patientId ? { patientId: user.patientId } : {}),
    ...(user.medicCaretakerId ? { medicCaretakerId: user.medicCaretakerId } : {}),
  };
}

export class AuthService {
  constructor({
    tokenSecret,
    users = seededUsers,
    tokenTtlSeconds = DEFAULT_TOKEN_TTL_SECONDS,
    now = () => Date.now(),
  }) {
    if (typeof tokenSecret !== 'string' || Buffer.byteLength(tokenSecret) < MINIMUM_SECRET_BYTES) {
      throw new TypeError(`Token secret must contain at least ${MINIMUM_SECRET_BYTES} bytes.`);
    }

    if (!Array.isArray(users) || users.length === 0) {
      throw new TypeError('At least one authentication user is required.');
    }

    if (!Number.isInteger(tokenTtlSeconds) || tokenTtlSeconds < 1) {
      throw new TypeError('Token lifetime must be a positive integer.');
    }

    if (typeof now !== 'function') {
      throw new TypeError('Authentication clock must be a function.');
    }

    this.tokenSecret = tokenSecret;
    this.users = [...users];
    this.tokenTtlSeconds = tokenTtlSeconds;
    this.now = now;
  }

  signIn(email, password) {
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const safePassword = typeof password === 'string' ? password : '';
    const user = this.users.find((candidate) => candidate.email === normalizedEmail);
    const passwordMatches = verifyPassword(safePassword, user?.passwordHash ?? DUMMY_PASSWORD_HASH);

    if (!user || !passwordMatches) {
      return null;
    }

    return {
      token: this.createToken(user),
      user: publicUser(user),
    };
  }

  createToken(user) {
    const issuedAt = Math.floor(this.now() / 1000);
    const header = encodeJson(TOKEN_HEADER);
    const payload = encodeJson({
      sub: String(user.id),
      role: user.role,
      iat: issuedAt,
      exp: issuedAt + this.tokenTtlSeconds,
    });
    const unsignedToken = `${header}.${payload}`;

    return `${unsignedToken}.${signValue(unsignedToken, this.tokenSecret)}`;
  }

  verifyToken(token) {
    try {
      if (typeof token !== 'string') {
        return null;
      }

      const parts = token.split('.');

      if (parts.length !== 3 || parts.some((part) => !part)) {
        return null;
      }

      const [headerPart, payloadPart, signature] = parts;
      const unsignedToken = `${headerPart}.${payloadPart}`;
      const expectedSignature = signValue(unsignedToken, this.tokenSecret);

      if (!signaturesMatch(signature, expectedSignature)) {
        return null;
      }

      const header = JSON.parse(Buffer.from(headerPart, 'base64url').toString('utf8'));
      const payload = JSON.parse(Buffer.from(payloadPart, 'base64url').toString('utf8'));
      const currentTime = Math.floor(this.now() / 1000);

      if (
        header.alg !== TOKEN_HEADER.alg ||
        header.typ !== TOKEN_HEADER.typ ||
        typeof payload.sub !== 'string' ||
        !Number.isInteger(payload.iat) ||
        !Number.isInteger(payload.exp) ||
        payload.exp <= currentTime
      ) {
        return null;
      }

      const user = this.users.find((candidate) => String(candidate.id) === payload.sub);

      if (!user || user.role !== payload.role) {
        return null;
      }

      return authenticatedUser(user);
    } catch {
      return null;
    }
  }
}
