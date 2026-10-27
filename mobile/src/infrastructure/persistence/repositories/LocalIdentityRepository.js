import { UserRole } from '../../../domain/value-objects/enums.js';

const LOCAL_PASSWORD_HASH = 'managed-by-api';
const CALENDAR_DATE = /^\d{4}-\d{2}-\d{2}$/;

function requirePositiveInteger(value, field) {
  if (!Number.isInteger(value) || value < 1) {
    throw new TypeError(`${field} must be a positive integer.`);
  }

  return value;
}

function requireCalendarDate(value, field) {
  if (typeof value !== 'string' || !CALENDAR_DATE.test(value)) {
    throw new TypeError(`${field} must be a calendar date.`);
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new TypeError(`${field} must be a valid calendar date.`);
  }

  return value;
}

function optionalCalendarDate(value, field) {
  return value === undefined || value === null ? null : requireCalendarDate(value, field);
}

function requireUser(value) {
  if (
    !value ||
    !Number.isInteger(value.id) ||
    value.id < 1 ||
    typeof value.name !== 'string' ||
    !value.name.trim() ||
    !Object.values(UserRole).includes(value.role)
  ) {
    throw new TypeError('Local identity requires a valid authenticated user.');
  }

  return value;
}

function localEmail(user) {
  return typeof user.email === 'string' && user.email.trim()
    ? user.email.trim().toLowerCase()
    : `local-${user.id}@myseizures.invalid`;
}

export class LocalIdentityRepository {
  constructor({ databaseProvider, now = () => new Date().toISOString() }) {
    if (typeof databaseProvider?.withTransaction !== 'function') {
      throw new TypeError('Local identity repository requires a database provider.');
    }
    if (typeof now !== 'function') {
      throw new TypeError('Local identity clock must be a function.');
    }

    this.databaseProvider = databaseProvider;
    this.now = now;
  }

  async synchronize(value) {
    const user = requireUser(value);
    const timestamp = this.now();

    return this.databaseProvider.withTransaction(async (database) => {
      await database.runAsync(
        `INSERT INTO users (id, name, email, password_hash, role, created_at)
         VALUES ($id, $name, $email, $passwordHash, $role, $createdAt)
         ON CONFLICT(id) DO UPDATE SET
           name = excluded.name,
           email = excluded.email,
           role = excluded.role;`,
        {
          $id: user.id,
          $name: user.name.trim(),
          $email: localEmail(user),
          $passwordHash: LOCAL_PASSWORD_HASH,
          $role: user.role,
          $createdAt: timestamp,
        },
      );

      if (user.role === UserRole.PATIENT) {
        const patientId = requirePositiveInteger(user.patientId, 'patientId');
        const birthDate = requireCalendarDate(user.birthDate, 'birthDate');
        const diagnosisDate = optionalCalendarDate(user.diagnosisDate, 'diagnosisDate');

        if (diagnosisDate && diagnosisDate < birthDate) {
          throw new TypeError('diagnosisDate must not be before birthDate.');
        }

        await database.runAsync(
          `INSERT INTO patients (id, user_id, birth_date, diagnosis_date)
           VALUES ($id, $userId, $birthDate, $diagnosisDate)
           ON CONFLICT(id) DO UPDATE SET
             user_id = excluded.user_id,
             birth_date = excluded.birth_date,
             diagnosis_date = excluded.diagnosis_date;`,
          {
            $id: patientId,
            $userId: user.id,
            $birthDate: birthDate,
            $diagnosisDate: diagnosisDate,
          },
        );
      }

      return Object.freeze({ patientId: user.patientId ?? null, userId: user.id });
    });
  }
}
