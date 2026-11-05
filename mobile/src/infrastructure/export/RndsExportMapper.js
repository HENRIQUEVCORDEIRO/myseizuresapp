import {
  ClinicAlertSeverity,
  SeizureOccurrenceType,
  TriggerCause,
} from '../../domain/value-objects/index.js';

export const RNDS_EXPORT_FORMAT_VERSION = '1.0';

function requireObject(value, field) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${field} must be an object.`);
  }
  return value;
}

function requireArray(value, field) {
  if (!Array.isArray(value)) throw new TypeError(`${field} must be an array.`);
  return value;
}

function requirePositiveInteger(value, field) {
  if (!Number.isInteger(value) || value < 1) {
    throw new TypeError(`${field} must be a positive integer.`);
  }
  return value;
}

function requireNonNegativeInteger(value, field) {
  if (!Number.isInteger(value) || value < 0) {
    throw new TypeError(`${field} must be a non-negative integer.`);
  }
  return value;
}

function requireString(value, field) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new TypeError(`${field} must be a non-empty string.`);
  }
  return value.trim();
}

function requireTimestamp(value, field) {
  const timestamp = requireString(value, field);
  if (!Number.isFinite(Date.parse(timestamp))) {
    throw new TypeError(`${field} must be a valid ISO 8601 timestamp.`);
  }
  return timestamp;
}

function requireCalendarDate(value, field) {
  const date = requireString(value, field);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(`${date}T00:00:00Z`))) {
    throw new TypeError(`${field} must be a valid calendar date.`);
  }
  return date;
}

function requireEnum(value, values, field) {
  if (!Object.values(values).includes(value)) {
    throw new TypeError(`${field} contains an unsupported value.`);
  }
  return value;
}

function requirePatientScope(value, patientId, field) {
  if (value !== undefined && value !== patientId) {
    throw new TypeError(`${field} belongs to another patient.`);
  }
}

function requireWithinPeriod(value, period, field) {
  const timestamp = requireTimestamp(value, field);
  const instant = Date.parse(timestamp);
  if (instant < Date.parse(period.start) || instant > Date.parse(period.end)) {
    throw new RangeError(`${field} must be inside the report period.`);
  }
  return timestamp;
}

function mapPeriod(report) {
  const period = requireObject(report.period, 'report.period');
  const start = requireTimestamp(period.periodStart, 'report.period.periodStart');
  const end = requireTimestamp(period.periodEnd, 'report.period.periodEnd');
  if (Date.parse(start) > Date.parse(end)) {
    throw new RangeError('Report period start must not be after its end.');
  }
  return { start, end };
}

function mapSeizure(value, patientId, period, index) {
  const seizure = requireObject(value, `report.seizures[${index}]`);
  requirePatientScope(seizure.patientId, patientId, `report.seizures[${index}]`);
  return {
    occurredAt: requireWithinPeriod(
      seizure.occurredAt,
      period,
      `report.seizures[${index}].occurredAt`,
    ),
    occurrenceType: requireEnum(
      seizure.occurrenceType,
      SeizureOccurrenceType,
      `report.seizures[${index}].occurrenceType`,
    ),
  };
}

function mapTrigger(value, patientId, period, index) {
  const trigger = requireObject(value, `report.triggers[${index}]`);
  requirePatientScope(trigger.patientId, patientId, `report.triggers[${index}]`);
  const mapped = {
    recordedAt: requireWithinPeriod(
      trigger.recordedAt,
      period,
      `report.triggers[${index}].recordedAt`,
    ),
    cause: requireEnum(trigger.commonCause, TriggerCause, `report.triggers[${index}].commonCause`),
    sleepQuality: requireNonNegativeInteger(
      trigger.sleepQuality,
      `report.triggers[${index}].sleepQuality`,
    ),
    mood: requireNonNegativeInteger(trigger.mood, `report.triggers[${index}].mood`),
  };
  if (trigger.otherDescription !== undefined && trigger.otherDescription !== null) {
    const description = requireString(
      trigger.otherDescription,
      `report.triggers[${index}].otherDescription`,
    );
    mapped.otherDescription = description;
  }
  if (mapped.cause === TriggerCause.OTHER && !mapped.otherDescription) {
    throw new TypeError('OTHER trigger exports require otherDescription.');
  }
  return mapped;
}

function mapAdherence(value) {
  const adherence = requireObject(value, 'report.adherence');
  const finalDoses = requireNonNegativeInteger(adherence.finalDoses, 'adherence.finalDoses');
  const takenDoses = requireNonNegativeInteger(adherence.takenDoses, 'adherence.takenDoses');
  if (takenDoses > finalDoses) throw new RangeError('Taken doses cannot exceed final doses.');
  const mapped = { finalDoses, takenDoses };
  if (finalDoses > 0) {
    if (typeof adherence.rate !== 'number' || adherence.rate < 0 || adherence.rate > 100) {
      throw new TypeError('adherence.rate must be between 0 and 100 when final doses exist.');
    }
    const expectedRate = (takenDoses / finalDoses) * 100;
    if (Math.abs(adherence.rate - expectedRate) > Number.EPSILON * 100) {
      throw new RangeError('Adherence rate must match the final dose counts.');
    }
    mapped.rate = adherence.rate;
  } else if (adherence.rate !== undefined) {
    throw new TypeError('adherence.rate must be omitted when there are no final doses.');
  }
  return mapped;
}

function mapAlert(value, index) {
  const alert = requireObject(value, `report.alerts[${index}]`);
  return {
    severity: requireEnum(alert.severity, ClinicAlertSeverity, `report.alerts[${index}].severity`),
    reason: requireString(alert.reason, `report.alerts[${index}].reason`),
  };
}

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

export class RndsExportMapper {
  constructor({ now = () => new Date().toISOString() } = {}) {
    if (typeof now !== 'function') throw new TypeError('Export mapper clock must be a function.');
    this.now = now;
  }

  map({ patient: patientValue, report: reportValue } = {}) {
    const patient = requireObject(patientValue, 'patient');
    const report = requireObject(reportValue, 'report');
    const patientId = requirePositiveInteger(patient.id, 'patient.id');
    requirePatientScope(report.patientId, patientId, 'report');
    const reportPeriod = mapPeriod(report);
    const output = {
      formatVersion: RNDS_EXPORT_FORMAT_VERSION,
      generatedAt: requireTimestamp(this.now(), 'generatedAt'),
      reportPeriod,
      patient: {
        id: patientId,
        birthDate: requireCalendarDate(patient.birthDate, 'patient.birthDate'),
      },
      seizures: requireArray(report.seizures, 'report.seizures').map((value, index) =>
        mapSeizure(value, patientId, reportPeriod, index),
      ),
      triggers: requireArray(report.triggers, 'report.triggers').map((value, index) =>
        mapTrigger(value, patientId, reportPeriod, index),
      ),
      adherence: mapAdherence(report.adherence),
      alerts: requireArray(report.alerts, 'report.alerts').map(mapAlert),
    };

    try {
      JSON.parse(JSON.stringify(output));
    } catch (error) {
      throw new TypeError('Export document must be JSON serializable.', { cause: error });
    }
    return deepFreeze(output);
  }
}
