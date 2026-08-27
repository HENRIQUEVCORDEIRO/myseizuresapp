import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { ReportAccessDeniedError } from '../../src/application/use-cases/reporting/index.js';

const EXPORT_REPORT_PATH = resolve(
  __dirname,
  '../../src/application/use-cases/export/ExportReport.js',
);
const MAPPER_PATH = resolve(__dirname, '../../src/infrastructure/export/RndsExportMapper.js');
const IMPLEMENTATION_PENDING = !existsSync(EXPORT_REPORT_PATH) || !existsSync(MAPPER_PATH);
const { ExportReport } = IMPLEMENTATION_PENDING ? {} : require(EXPORT_REPORT_PATH);
const { RndsExportMapper } = IMPLEMENTATION_PENDING ? {} : require(MAPPER_PATH);
const describeExport = IMPLEMENTATION_PENDING ? describe.skip : describe;

const PATIENT_ID = 1;
const PERIOD_END = '2026-08-27T23:59:59.999Z';
const GENERATED_AT = '2026-08-27T12:00:00.000Z';

function report() {
  return {
    patientId: PATIENT_ID,
    period: {
      periodStart: '2026-08-21T00:00:00.000Z',
      periodEnd: PERIOD_END,
    },
    seizures: [
      {
        patientId: PATIENT_ID,
        occurredAt: '2026-08-24T12:00:00.000Z',
        occurrenceType: 'FOCAL',
      },
    ],
    triggers: [],
    triggerTrends: [],
    adherence: { finalDoses: 2, takenDoses: 2, rate: 100 },
    alerts: [],
    empty: false,
  };
}

function exportedDocument(request) {
  const value =
    request?.data ?? request?.document ?? request?.content ?? request?.contents ?? request;
  return typeof value === 'string' ? JSON.parse(value) : value;
}

function harness({ generateReport } = {}) {
  const patientRepository = {
    findPatientById: jest.fn().mockResolvedValue({
      id: PATIENT_ID,
      birthDate: '1980-01-01',
    }),
  };
  const exportMapper = new RndsExportMapper({ now: () => GENERATED_AT });
  const reportExporter = {
    exportJsonFile: jest.fn().mockResolvedValue({
      uri: 'file:///local/epilepsy-report.json',
    }),
  };
  const reportUseCase = generateReport ?? { execute: jest.fn().mockResolvedValue(report()) };
  const useCase = new ExportReport({
    generateReport: reportUseCase,
    patientRepository,
    exportMapper,
    reportExporter,
  });

  return { exportMapper, patientRepository, reportExporter, reportUseCase, useCase };
}

describeExport('authorized local-only report export', () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    global.fetch = jest.fn(() => {
      throw new Error('Export must not initiate an HTTP request.');
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('writes an authorized mapped report through the local export port without HTTP', async () => {
    const { patientRepository, reportExporter, reportUseCase, useCase } = harness();

    await expect(
      useCase.execute({
        patientId: PATIENT_ID,
        periodType: 'WEEKLY',
        periodEnd: PERIOD_END,
      }),
    ).resolves.toEqual({ uri: 'file:///local/epilepsy-report.json' });

    expect(reportUseCase.execute).toHaveBeenCalledWith({
      patientId: PATIENT_ID,
      periodType: 'WEEKLY',
      periodEnd: PERIOD_END,
    });
    expect(patientRepository.findPatientById).toHaveBeenCalledWith(PATIENT_ID);
    expect(reportExporter.exportJsonFile).toHaveBeenCalledTimes(1);
    expect(exportedDocument(reportExporter.exportJsonFile.mock.calls[0][0])).toMatchObject({
      formatVersion: '1.0',
      generatedAt: GENERATED_AT,
      patient: { id: PATIENT_ID, birthDate: '1980-01-01' },
      reportPeriod: {
        start: '2026-08-21T00:00:00.000Z',
        end: PERIOD_END,
      },
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('denies an unauthorized export before reading, mapping, writing, or using HTTP', async () => {
    const generateReport = {
      execute: jest.fn().mockRejectedValue(new ReportAccessDeniedError()),
    };
    const { exportMapper, patientRepository, reportExporter, useCase } = harness({
      generateReport,
    });
    const mapSpy = jest.spyOn(exportMapper, 'map');

    await expect(
      useCase.execute({
        patientId: PATIENT_ID,
        periodType: 'WEEKLY',
        periodEnd: PERIOD_END,
      }),
    ).rejects.toBeInstanceOf(ReportAccessDeniedError);

    expect(patientRepository.findPatientById).not.toHaveBeenCalled();
    expect(mapSpy).not.toHaveBeenCalled();
    expect(reportExporter.exportJsonFile).not.toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
