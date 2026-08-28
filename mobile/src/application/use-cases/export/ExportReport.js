import { PatientRepositoryPort, ReportExportPort } from '../../ports/index.js';

function requireExecutable(value, name) {
  if (typeof value?.execute !== 'function') {
    throw new TypeError(`${name} must implement execute().`);
  }
  return value;
}

function requireMapper(value) {
  if (typeof value?.map !== 'function') {
    throw new TypeError('Export mapper must implement map().');
  }
  return value;
}

function requirePositiveInteger(value, field) {
  if (!Number.isInteger(value) || value < 1) {
    throw new TypeError(`${field} must be a positive integer.`);
  }
  return value;
}

export class PatientProfileUnavailableError extends Error {
  constructor() {
    super('The patient profile required for export is unavailable.');
    this.name = 'PatientProfileUnavailableError';
  }
}

export class ExportReport {
  constructor({ generateReport, patientRepository, exportMapper, reportExporter } = {}) {
    this.generateReport = requireExecutable(generateReport, 'Report generator');
    this.patientRepository = PatientRepositoryPort.assert(patientRepository);
    this.exportMapper = requireMapper(exportMapper);
    this.reportExporter = ReportExportPort.assert(reportExporter);
  }

  async execute({ patientId: patientValue, periodType, periodEnd, share = true } = {}) {
    const patientId = requirePositiveInteger(patientValue, 'patientId');

    // GenerateReport is the authorization boundary. Nothing else is read or written before it passes.
    const report = await this.generateReport.execute({ patientId, periodType, periodEnd });
    const patient = await this.patientRepository.findPatientById(patientId);
    if (!patient) throw new PatientProfileUnavailableError();
    const data = this.exportMapper.map({ patient, report });
    return this.reportExporter.exportJsonFile({ data, share });
  }
}
