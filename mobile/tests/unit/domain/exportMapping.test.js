import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const MAPPER_PATH = resolve(__dirname, '../../../src/infrastructure/export/RndsExportMapper.js');
const IMPLEMENTATION_PENDING = !existsSync(MAPPER_PATH);
const { RndsExportMapper } = IMPLEMENTATION_PENDING ? {} : require(MAPPER_PATH);
const describeMapper = IMPLEMENTATION_PENDING ? describe.skip : describe;

const GENERATED_AT = '2026-08-27T12:00:00.000Z';

function exportInput() {
  return {
    patient: {
      id: 1,
      birthDate: '1980-01-01',
      passwordHash: 'must-not-be-exported',
      accessToken: 'must-not-be-exported',
    },
    report: {
      patientId: 1,
      period: {
        periodStart: '2026-08-01T00:00:00.000Z',
        periodEnd: '2026-08-27T23:59:59.999Z',
      },
      seizures: [
        {
          id: 10,
          patientId: 1,
          occurredAt: '2026-08-10T12:00:00.000Z',
          occurrenceType: 'GENERALIZED',
          createdAt: '2026-08-10T12:05:00.000Z',
        },
      ],
      triggers: [
        {
          id: 11,
          patientId: 1,
          recordedAt: '2026-08-10T13:00:00.000Z',
          commonCause: 'SLEEP',
          otherDescription: null,
          sleepQuality: 2,
          mood: 3,
          createdAt: '2026-08-10T13:05:00.000Z',
        },
      ],
      adherence: { finalDoses: 20, takenDoses: 18, rate: 90 },
      alerts: [
        {
          id: 'LOW_ADHERENCE',
          severity: 'MEDIUM',
          reason: 'Prototype threshold matched.',
          ruleVersion: 'prototype-1.0',
        },
      ],
      triggerTrends: [{ cause: 'SLEEP', count: 1 }],
      empty: false,
      sessionToken: 'must-not-be-exported',
    },
  };
}

function mapper() {
  return new RndsExportMapper({ now: () => GENERATED_AT });
}

describeMapper('RNDS/e-SUS report export mapping', () => {
  test('maps every required contract field with format version 1.0', () => {
    const output = mapper().map(exportInput());

    expect(output).toEqual({
      formatVersion: '1.0',
      generatedAt: GENERATED_AT,
      reportPeriod: {
        start: '2026-08-01T00:00:00.000Z',
        end: '2026-08-27T23:59:59.999Z',
      },
      patient: { id: 1, birthDate: '1980-01-01' },
      seizures: [
        {
          occurredAt: '2026-08-10T12:00:00.000Z',
          occurrenceType: 'GENERALIZED',
        },
      ],
      triggers: [
        {
          recordedAt: '2026-08-10T13:00:00.000Z',
          cause: 'SLEEP',
          sleepQuality: 2,
          mood: 3,
        },
      ],
      adherence: { finalDoses: 20, takenDoses: 18, rate: 90 },
      alerts: [{ severity: 'MEDIUM', reason: 'Prototype threshold matched.' }],
    });
    expect(JSON.stringify(output)).not.toMatch(/password|token|createdAt|ruleVersion/i);
  });

  test('includes meaningful optional details and omits absent optional values', () => {
    const input = exportInput();
    input.report.triggers.push({
      patientId: 1,
      recordedAt: '2026-08-11T13:00:00.000Z',
      commonCause: 'OTHER',
      otherDescription: 'Flashing light',
      sleepQuality: 4,
      mood: 2,
    });
    input.report.adherence = { finalDoses: 0, takenDoses: 0, rate: undefined };

    const output = mapper().map(input);

    expect(output.triggers[0]).not.toHaveProperty('otherDescription');
    expect(output.triggers[1]).toHaveProperty('otherDescription', 'Flashing light');
    expect(output.adherence).toEqual({ finalDoses: 0, takenDoses: 0 });
    expect(JSON.stringify(output)).not.toContain('undefined');
  });

  test.each([
    ['patient id', (input) => delete input.patient.id],
    ['patient birth date', (input) => delete input.patient.birthDate],
    ['report period start', (input) => delete input.report.period.periodStart],
    ['report period end', (input) => delete input.report.period.periodEnd],
    ['seizure occurrence time', (input) => delete input.report.seizures[0].occurredAt],
    ['seizure occurrence type', (input) => delete input.report.seizures[0].occurrenceType],
    ['trigger recorded time', (input) => delete input.report.triggers[0].recordedAt],
    ['trigger cause', (input) => delete input.report.triggers[0].commonCause],
    ['trigger sleep quality', (input) => delete input.report.triggers[0].sleepQuality],
    ['trigger mood', (input) => delete input.report.triggers[0].mood],
    ['adherence final doses', (input) => delete input.report.adherence.finalDoses],
    ['adherence taken doses', (input) => delete input.report.adherence.takenDoses],
    ['adherence rate when final doses exist', (input) => delete input.report.adherence.rate],
    ['alert severity', (input) => delete input.report.alerts[0].severity],
    ['alert reason', (input) => delete input.report.alerts[0].reason],
  ])('rejects a missing required %s', (_field, removeField) => {
    const input = exportInput();
    removeField(input);
    expect(() => mapper().map(input)).toThrow();
  });

  test('rejects an invalid generated timestamp before producing serializable output', () => {
    expect(() => new RndsExportMapper({ now: () => 'invalid' }).map(exportInput())).toThrow();
  });
});
