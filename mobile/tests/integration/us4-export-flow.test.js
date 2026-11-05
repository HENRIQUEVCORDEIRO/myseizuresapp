import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { ExportReport } from '../../src/application/use-cases/export/index.js';
import {
  GenerateReport,
  ReportAccessDeniedError,
} from '../../src/application/use-cases/reporting/index.js';
import { ReportFileExporter, RndsExportMapper } from '../../src/infrastructure/export/index.js';
import {
  PatientRepository,
  SeizureRepository,
  TreatmentRepository,
  TriggerRepository,
} from '../../src/infrastructure/persistence/repositories/index.js';
import { DatabaseProvider } from '../../src/infrastructure/persistence/sqlite/DatabaseProvider.js';
import { createSQLiteTestDatabase } from '../unit/factories/sqliteTestDatabase.js';

const PATIENT_ID = 1;
const PERIOD_END = '2026-08-27T23:59:59.999Z';
const GENERATED_AT = '2026-08-27T12:00:00.000Z';

function localExporter(files) {
  class EvidenceFile {
    constructor(directory, fileName) {
      this.uri = `${directory}/${fileName}`;
      this.contents = null;
      files.push(this);
    }

    create() {}

    write(contents) {
      this.contents = contents;
    }
  }

  return new ReportFileExporter({
    FileAdapter: EvidenceFile,
    directory: 'file:///local-evidence',
    sharing: {
      isAvailableAsync: jest.fn().mockResolvedValue(false),
      shareAsync: jest.fn(),
    },
  });
}

function reportGenerator(provider, access) {
  return new GenerateReport({
    seizureRepository: new SeizureRepository({ databaseProvider: provider }),
    triggerRepository: new TriggerRepository({ databaseProvider: provider }),
    treatmentRepository: new TreatmentRepository({ databaseProvider: provider }),
    ...access,
  });
}

async function seedSelectedPeriod(database) {
  await database.runAsync(
    `INSERT INTO users (id, name, email, password_hash, role, created_at)
     VALUES (1, 'Patient', 'patient@example.test', 'private-password-hash', 'PATIENT', $now);`,
    { $now: '2026-08-20T00:00:00.000Z' },
  );
  await database.runAsync(
    `INSERT INTO patients (id, user_id, birth_date, diagnosis_date)
     VALUES (1, 1, '1980-01-01', '2020-01-01');`,
  );
  for (const [occurredAt, occurrenceType] of [
    ['2026-08-23T08:00:00.000Z', 'FOCAL'],
    ['2026-08-24T09:00:00.000Z', 'GENERALIZED'],
    ['2026-08-25T10:00:00.000Z', 'FOCAL'],
  ]) {
    await database.runAsync(
      `INSERT INTO seizure_records
         (patient_id, occurred_at, occurrence_type, created_at)
       VALUES (1, $occurredAt, $occurrenceType, $occurredAt);`,
      { $occurredAt: occurredAt, $occurrenceType: occurrenceType },
    );
  }
  await database.runAsync(
    `INSERT INTO trigger_records
       (patient_id, recorded_at, common_cause, other_description, sleep_quality, mood, created_at)
     VALUES (1, '2026-08-24T11:00:00.000Z', 'SLEEP', NULL, 2, 3,
             '2026-08-24T11:00:00.000Z');`,
  );
}

test('authorized export is local and redacted while denied export creates no file', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'myseizures-us4-'));
  const resolvedDirectory = resolve(directory);
  const database = createSQLiteTestDatabase(join(resolvedDirectory, 'care.db'));
  const provider = new DatabaseProvider({
    databaseName: 'care.db',
    openDatabase: jest.fn().mockResolvedValue(database),
  });
  const files = [];
  const originalFetch = global.fetch;
  global.fetch = jest.fn(() => {
    throw new Error('Export must remain local.');
  });

  try {
    await provider.initialize();
    await seedSelectedPeriod(database);
    const patientRepository = new PatientRepository({ databaseProvider: provider });
    const exportMapper = new RndsExportMapper({ now: () => GENERATED_AT });
    const reportExporter = localExporter(files);
    const authorizedExport = new ExportReport({
      generateReport: reportGenerator(provider, { getActivePatientId: () => PATIENT_ID }),
      patientRepository,
      exportMapper,
      reportExporter,
    });

    const localFile = await authorizedExport.execute({
      patientId: PATIENT_ID,
      periodType: 'WEEKLY',
      periodEnd: PERIOD_END,
      share: false,
    });
    expect(localFile).toMatchObject({ shared: false, uri: expect.stringMatching(/^file:/) });
    expect(files).toHaveLength(1);
    const redactedSample = JSON.parse(files[0].contents);
    expect(redactedSample).toMatchObject({
      formatVersion: '1.0',
      generatedAt: GENERATED_AT,
      patient: { id: PATIENT_ID, birthDate: '1980-01-01' },
      reportPeriod: { start: '2026-08-21T00:00:00.000Z', end: PERIOD_END },
      adherence: { finalDoses: 0, takenDoses: 0 },
    });
    expect(redactedSample.seizures).toHaveLength(3);
    expect(redactedSample.triggers).toHaveLength(1);
    expect(redactedSample.alerts).toEqual([
      expect.objectContaining({ severity: 'HIGH', reason: expect.any(String) }),
    ]);
    expect(files[0].contents).not.toMatch(/password|hash|token|email|diagnosisDate|createdAt/i);
    expect(global.fetch).not.toHaveBeenCalled();

    const authorizePatientAccess = {
      execute: jest.fn().mockResolvedValue({ ok: true, value: { allowed: false } }),
    };
    const deniedExport = new ExportReport({
      generateReport: reportGenerator(provider, {
        authorizePatientAccess,
        getActivePatientId: () => null,
      }),
      patientRepository,
      exportMapper,
      reportExporter,
    });
    await expect(
      deniedExport.execute({
        patientId: PATIENT_ID,
        periodType: 'WEEKLY',
        periodEnd: PERIOD_END,
        share: false,
      }),
    ).rejects.toBeInstanceOf(ReportAccessDeniedError);
    expect(authorizePatientAccess.execute).toHaveBeenCalledWith({ patientId: PATIENT_ID });
    expect(files).toHaveLength(1);
    expect(global.fetch).not.toHaveBeenCalled();
  } finally {
    global.fetch = originalFetch;
    await database.closeAsync();
    if (resolvedDirectory.startsWith(resolve(tmpdir()))) {
      rmSync(resolvedDirectory, { recursive: true, force: true });
    }
  }
});
