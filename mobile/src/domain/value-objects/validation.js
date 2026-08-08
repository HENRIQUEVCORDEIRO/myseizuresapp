const ISO_UTC_TIMESTAMP = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?Z$/;
const CALENDAR_DATE = /^\d{4}-\d{2}-\d{2}$/;
const CLOCK_TIME = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export class DomainValidationError extends Error {
  constructor(field, message) {
    super(`${field}: ${message}`);
    this.name = 'DomainValidationError';
    this.field = field;
  }
}

export function requireString(value, field) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new DomainValidationError(field, 'must be a non-empty string');
  }

  return value.trim();
}

export function optionalString(value, field) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  return requireString(value, field);
}

export function requireEmail(value, field = 'email') {
  const email = requireString(value, field).toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new DomainValidationError(field, 'must be a valid email address');
  }

  return email;
}

export function requireInteger(value, field, { min, max } = {}) {
  if (!Number.isInteger(value)) {
    throw new DomainValidationError(field, 'must be an integer');
  }

  if (min !== undefined && value < min) {
    throw new DomainValidationError(field, `must be at least ${min}`);
  }

  if (max !== undefined && value > max) {
    throw new DomainValidationError(field, `must be at most ${max}`);
  }

  return value;
}

export function requireEntityId(value, field) {
  return requireInteger(value, field, { min: 1 });
}

export function optionalEntityId(value, field = 'id') {
  if (value === undefined || value === null) {
    return null;
  }

  return requireEntityId(value, field);
}

export function requireEnum(value, allowedValues, field) {
  if (!Object.values(allowedValues).includes(value)) {
    throw new DomainValidationError(
      field,
      `must be one of: ${Object.values(allowedValues).join(', ')}`,
    );
  }

  return value;
}

export function requireTimestamp(value, field, { allowFuture = true } = {}) {
  if (value instanceof Date && Number.isNaN(value.getTime())) {
    throw new DomainValidationError(field, 'must be a valid timestamp');
  }

  const timestamp = value instanceof Date ? value.toISOString() : value;
  const match = typeof timestamp === 'string' ? ISO_UTC_TIMESTAMP.exec(timestamp) : null;

  if (!match) {
    throw new DomainValidationError(field, 'must be an ISO 8601 UTC timestamp');
  }

  const parsed = new Date(timestamp);

  if (Number.isNaN(parsed.getTime())) {
    throw new DomainValidationError(field, 'must be a valid timestamp');
  }

  const [, year, month, day, hour, minute, second] = match.map(Number);
  const componentsMatch =
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day &&
    parsed.getUTCHours() === hour &&
    parsed.getUTCMinutes() === minute &&
    parsed.getUTCSeconds() === second;

  if (!componentsMatch) {
    throw new DomainValidationError(field, 'must be a valid timestamp');
  }

  if (!allowFuture && parsed.getTime() > Date.now()) {
    throw new DomainValidationError(field, 'must not be in the future');
  }

  return parsed.toISOString();
}

export function optionalTimestamp(value, field, options) {
  if (value === undefined || value === null) {
    return null;
  }

  return requireTimestamp(value, field, options);
}

export function requireCalendarDate(value, field) {
  if (typeof value !== 'string' || !CALENDAR_DATE.test(value)) {
    throw new DomainValidationError(field, 'must use YYYY-MM-DD format');
  }

  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    throw new DomainValidationError(field, 'must be a valid calendar date');
  }

  return value;
}

export function optionalCalendarDate(value, field) {
  if (value === undefined || value === null) {
    return null;
  }

  return requireCalendarDate(value, field);
}

export function requireClockTime(value, field = 'scheduledTime') {
  if (typeof value !== 'string' || !CLOCK_TIME.test(value)) {
    throw new DomainValidationError(field, 'must use 24-hour HH:mm format');
  }

  return value;
}

export function requireBoolean(value, field) {
  if (typeof value !== 'boolean') {
    throw new DomainValidationError(field, 'must be a boolean');
  }

  return value;
}
