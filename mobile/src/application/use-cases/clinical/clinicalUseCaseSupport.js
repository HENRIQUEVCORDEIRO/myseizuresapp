import { requireEntityId, requireTimestamp } from '../../../domain/value-objects/validation.js';

export class ActivePatientScopeError extends Error {
  constructor(message = 'The requested patient is not the active patient.') {
    super(message);
    this.name = 'ActivePatientScopeError';
  }
}

export function requireAdapterMethod(adapter, method, adapterName) {
  if (!adapter || typeof adapter[method] !== 'function') {
    throw new TypeError(`${adapterName} must implement ${method}().`);
  }

  return adapter;
}

export function requireActivePatientResolver(getActivePatientId) {
  if (typeof getActivePatientId !== 'function') {
    throw new TypeError('getActivePatientId must be a function.');
  }

  return getActivePatientId;
}

export function requireInput(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError('Clinical use case input must be an object.');
  }

  return input;
}

export async function resolveActivePatientId(getActivePatientId, input) {
  const activePatientId = requireEntityId(await getActivePatientId(), 'activePatientId');

  if (input.patientId !== undefined) {
    const requestedPatientId = requireEntityId(input.patientId, 'patientId');

    if (requestedPatientId !== activePatientId) {
      throw new ActivePatientScopeError();
    }
  }

  return activePatientId;
}

export function requirePeriod(input) {
  const periodStart = requireTimestamp(input.periodStart, 'periodStart');
  const periodEnd = requireTimestamp(input.periodEnd, 'periodEnd');

  if (Date.parse(periodStart) > Date.parse(periodEnd)) {
    throw new RangeError('periodStart must not be after periodEnd.');
  }

  return { periodStart, periodEnd };
}

export function requireClock(now) {
  if (typeof now !== 'function') {
    throw new TypeError('now must be a function.');
  }

  return now;
}
