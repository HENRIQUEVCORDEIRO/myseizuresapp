import {
  aggregateAdherence,
  calculateTriggerTrends,
  evaluateClinicalAlerts,
  selectReportPeriod,
} from '../../../domain/rules/reportingRules.js';
import { reportingContext, requirePatientId } from './reportingUseCaseSupport.js';

export class ReportAccessDeniedError extends Error {
  constructor() {
    super('Access is not permitted.');
    this.name = 'ReportAccessDeniedError';
  }
}

export class GenerateReport {
  constructor(options) {
    Object.assign(this, reportingContext(options));
  }

  async requireAccess(patientId) {
    const activePatientId = await this.getActivePatientId?.();
    if (activePatientId === patientId) return;
    if (!this.authorizePatientAccess) throw new ReportAccessDeniedError();
    const result = await this.authorizePatientAccess.execute({ patientId });
    if (!result?.ok || result.value?.allowed !== true) throw new ReportAccessDeniedError();
  }

  async execute({ patientId: patientValue, periodType, periodEnd } = {}) {
    const patientId = requirePatientId(patientValue);
    await this.requireAccess(patientId);
    const period = selectReportPeriod({ periodType, periodEnd });
    const [seizures, triggers, confirmations] = await Promise.all([
      this.seizureRepository.listSeizuresByPeriod(patientId, period),
      this.triggerRepository.listTriggersByPeriod(patientId, period),
      this.treatmentRepository.listAdherenceByPeriod(patientId, period),
    ]);
    const adherence = aggregateAdherence(confirmations);
    const alerts = evaluateClinicalAlerts({
      seizureCount: seizures.length,
      adherenceRate: adherence.rate,
    });
    return Object.freeze({
      patientId,
      period,
      seizures: Object.freeze([...seizures]),
      triggers: Object.freeze([...triggers]),
      triggerTrends: calculateTriggerTrends(triggers),
      adherence,
      alerts,
      empty: seizures.length === 0 && triggers.length === 0 && adherence.finalDoses === 0,
    });
  }
}
