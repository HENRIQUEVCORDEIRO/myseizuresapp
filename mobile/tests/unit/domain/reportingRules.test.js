import {
  aggregateAdherence,
  aggregateAura,
  evaluateClinicalAlerts,
  REPORTING_ALERT_RULES,
  selectReportPeriod,
} from '../../../src/domain/rules/reportingRules.js';

describe('reporting period and clinical indicator rules', () => {
  test.each([
    ['WEEKLY', '2026-08-18T00:00:00.000Z'],
    ['MONTHLY', '2026-08-01T00:00:00.000Z'],
    ['ANNUAL', '2026-01-01T00:00:00.000Z'],
  ])(
    'selects the inclusive %s period ending at the supplied instant',
    (periodType, periodStart) => {
      expect(selectReportPeriod({ periodType, periodEnd: '2026-08-24T23:59:59.999Z' })).toEqual({
        periodStart,
        periodEnd: '2026-08-24T23:59:59.999Z',
      });
    },
  );

  test('aggregates only final taken/missed confirmations and leaves an empty rate undefined', () => {
    expect(aggregateAdherence([])).toEqual({ finalDoses: 0, takenDoses: 0, rate: undefined });
    expect(
      aggregateAdherence([
        { reminderId: 1, consumptionStatus: 'TAKEN' },
        { reminderId: 2, consumptionStatus: 'MISSED' },
        { reminderId: 3, consumptionStatus: 'SCHEDULED' },
      ]),
    ).toEqual({ finalDoses: 2, takenDoses: 1, rate: 50 });
  });

  test('calculates the aura percentage over recorded seizures only', () => {
    expect(aggregateAura([])).toEqual({
      totalSeizures: 0,
      withAura: 0,
      rate: undefined,
    });
    expect(aggregateAura([{ feltAura: true }, { feltAura: false }, { feltAura: false }])).toEqual({
      totalSeizures: 3,
      withAura: 1,
      rate: (1 / 3) * 100,
    });
    expect(aggregateAura([{ feltAura: true }, { feltAura: true }])).toEqual({
      totalSeizures: 2,
      withAura: 2,
      rate: 100,
    });
    expect(() => aggregateAura([{ feltAura: 'yes' }])).toThrow(
      'seizures[0].feltAura must be a boolean.',
    );
  });

  test('applies seizure and adherence indicators exactly at their documented boundaries', () => {
    const seizureBoundary = REPORTING_ALERT_RULES.seizureCount.minimum;
    const adherenceBoundary = REPORTING_ALERT_RULES.adherenceRate.below;
    expect(
      evaluateClinicalAlerts({
        seizureCount: seizureBoundary - 1,
        adherenceRate: adherenceBoundary,
      }),
    ).toEqual([]);
    expect(
      evaluateClinicalAlerts({
        seizureCount: seizureBoundary,
        adherenceRate: adherenceBoundary - 1,
      }),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleVersion: REPORTING_ALERT_RULES.version,
          severity: expect.any(String),
          reason: expect.any(String),
        }),
      ]),
    );
  });
});
