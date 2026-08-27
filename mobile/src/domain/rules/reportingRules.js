import { ClinicAlertSeverity, ConsumptionStatus } from '../value-objects/enums.js';

export const ReportPeriodType = Object.freeze({
  WEEKLY: 'WEEKLY',
  MONTHLY: 'MONTHLY',
  ANNUAL: 'ANNUAL',
});

export const REPORTING_ALERT_RULES = Object.freeze({
  version: 'prototype-1.0',
  seizureCount: Object.freeze({
    minimum: 3,
    severity: ClinicAlertSeverity.HIGH,
  }),
  adherenceRate: Object.freeze({
    below: 80,
    severity: ClinicAlertSeverity.MEDIUM,
  }),
});

function requireArray(value, field) {
  if (!Array.isArray(value)) throw new TypeError(`${field} must be an array.`);
  return value;
}

function requirePeriodEnd(value) {
  if (typeof value !== 'string' || !Number.isFinite(Date.parse(value))) {
    throw new TypeError('periodEnd must be a valid ISO 8601 timestamp.');
  }
  return value;
}

export function selectReportPeriod({ periodType, periodEnd } = {}) {
  if (!Object.values(ReportPeriodType).includes(periodType)) {
    throw new TypeError('periodType must be WEEKLY, MONTHLY, or ANNUAL.');
  }
  const end = requirePeriodEnd(periodEnd);
  const start = new Date(end);
  start.setUTCHours(0, 0, 0, 0);

  if (periodType === ReportPeriodType.WEEKLY) {
    start.setUTCDate(start.getUTCDate() - 6);
  } else if (periodType === ReportPeriodType.MONTHLY) {
    start.setUTCDate(1);
  } else {
    start.setUTCMonth(0, 1);
  }

  return Object.freeze({ periodStart: start.toISOString(), periodEnd: end });
}

export function aggregateAdherence(confirmations) {
  const finalConfirmations = requireArray(confirmations, 'confirmations').filter((confirmation) =>
    Object.values(ConsumptionStatus).includes(confirmation?.consumptionStatus),
  );
  const reminderIds = new Set();
  let takenDoses = 0;

  for (const confirmation of finalConfirmations) {
    if (!Number.isInteger(confirmation.reminderId) || confirmation.reminderId < 1) {
      throw new TypeError('Final confirmations require a positive reminderId.');
    }
    if (reminderIds.has(confirmation.reminderId)) {
      throw new TypeError('A report cannot contain duplicate final confirmations.');
    }
    reminderIds.add(confirmation.reminderId);
    if (confirmation.consumptionStatus === ConsumptionStatus.TAKEN) takenDoses += 1;
  }

  const finalDoses = finalConfirmations.length;
  return Object.freeze({
    finalDoses,
    takenDoses,
    rate: finalDoses === 0 ? undefined : (takenDoses / finalDoses) * 100,
  });
}

export function calculateTriggerTrends(triggers) {
  const counts = new Map();
  for (const trigger of requireArray(triggers, 'triggers')) {
    if (typeof trigger?.commonCause !== 'string' || !trigger.commonCause) {
      throw new TypeError('Trigger trends require a commonCause.');
    }
    counts.set(trigger.commonCause, (counts.get(trigger.commonCause) ?? 0) + 1);
  }
  return Object.freeze(
    [...counts.entries()]
      .map(([cause, count]) => Object.freeze({ cause, count }))
      .sort((left, right) => right.count - left.count || left.cause.localeCompare(right.cause)),
  );
}

export function evaluateClinicalAlerts({ seizureCount = 0, adherenceRate } = {}) {
  if (!Number.isInteger(seizureCount) || seizureCount < 0) {
    throw new TypeError('seizureCount must be a non-negative integer.');
  }
  if (
    adherenceRate !== undefined &&
    (typeof adherenceRate !== 'number' || adherenceRate < 0 || adherenceRate > 100)
  ) {
    throw new TypeError('adherenceRate must be between 0 and 100 when supplied.');
  }

  const alerts = [];
  if (seizureCount >= REPORTING_ALERT_RULES.seizureCount.minimum) {
    alerts.push(
      Object.freeze({
        id: 'SEIZURE_FREQUENCY',
        severity: REPORTING_ALERT_RULES.seizureCount.severity,
        reason: `At least ${REPORTING_ALERT_RULES.seizureCount.minimum} seizures were recorded in the selected period. This is an informational prototype indicator, not a diagnosis.`,
        ruleVersion: REPORTING_ALERT_RULES.version,
      }),
    );
  }
  if (adherenceRate !== undefined && adherenceRate < REPORTING_ALERT_RULES.adherenceRate.below) {
    alerts.push(
      Object.freeze({
        id: 'LOW_ADHERENCE',
        severity: REPORTING_ALERT_RULES.adherenceRate.severity,
        reason: `Recorded adherence is below ${REPORTING_ALERT_RULES.adherenceRate.below}% for final dose confirmations. This is an informational prototype indicator, not a diagnosis.`,
        ruleVersion: REPORTING_ALERT_RULES.version,
      }),
    );
  }
  return Object.freeze(alerts);
}
