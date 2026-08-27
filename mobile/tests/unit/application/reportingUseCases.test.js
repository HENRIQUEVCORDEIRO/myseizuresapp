import {
  GenerateReport,
  ReportAccessDeniedError,
} from '../../../src/application/use-cases/reporting/index.js';
import { ReportPeriodType } from '../../../src/domain/rules/reportingRules.js';

const END = '2026-08-24T23:59:59.999Z';

function repositories({ seizures = [], triggers = [], confirmations = [] } = {}) {
  return {
    seizureRepository: { listSeizuresByPeriod: jest.fn().mockResolvedValue(seizures) },
    triggerRepository: { listTriggersByPeriod: jest.fn().mockResolvedValue(triggers) },
    treatmentRepository: { listAdherenceByPeriod: jest.fn().mockResolvedValue(confirmations) },
  };
}

describe('GenerateReport', () => {
  test('derives period records, trends, adherence, and alerts without persisting a snapshot', async () => {
    const adapters = repositories({
      seizures: [{ id: 1 }, { id: 2 }, { id: 3 }],
      triggers: [{ commonCause: 'SLEEP' }, { commonCause: 'STRESS' }, { commonCause: 'SLEEP' }],
      confirmations: [
        { reminderId: 1, consumptionStatus: 'TAKEN' },
        { reminderId: 2, consumptionStatus: 'MISSED' },
      ],
    });
    const report = await new GenerateReport({
      ...adapters,
      getActivePatientId: () => 1,
    }).execute({ patientId: 1, periodType: ReportPeriodType.WEEKLY, periodEnd: END });

    expect(report.period.periodStart).toBe('2026-08-18T00:00:00.000Z');
    expect(report.triggerTrends).toEqual([
      { cause: 'SLEEP', count: 2 },
      { cause: 'STRESS', count: 1 },
    ]);
    expect(report.adherence).toEqual({ finalDoses: 2, takenDoses: 1, rate: 50 });
    expect(report.alerts.map((alert) => alert.id)).toEqual(['SEIZURE_FREQUENCY', 'LOW_ADHERENCE']);
    expect(report.empty).toBe(false);
    expect(Object.keys(adapters).some((name) => /save|store/i.test(name))).toBe(false);
  });

  test('returns an explicit empty report with no inferred adherence or alerts', async () => {
    const report = await new GenerateReport({
      ...repositories(),
      getActivePatientId: () => 1,
    }).execute({ patientId: 1, periodType: ReportPeriodType.MONTHLY, periodEnd: END });
    expect(report.empty).toBe(true);
    expect(report.adherence.rate).toBeUndefined();
    expect(report.alerts).toEqual([]);
  });

  test('requires authorization before querying another patient', async () => {
    const adapters = repositories();
    const authorizePatientAccess = {
      execute: jest.fn().mockResolvedValue({ ok: true, value: { allowed: false } }),
    };
    const useCase = new GenerateReport({
      ...adapters,
      authorizePatientAccess,
      getActivePatientId: () => 1,
    });
    await expect(
      useCase.execute({ patientId: 2, periodType: ReportPeriodType.ANNUAL, periodEnd: END }),
    ).rejects.toBeInstanceOf(ReportAccessDeniedError);
    expect(adapters.seizureRepository.listSeizuresByPeriod).not.toHaveBeenCalled();
  });
});
