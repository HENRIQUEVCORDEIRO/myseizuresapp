import { SeizureRecord, TriggerRecord } from '../../../src/domain/entities/index.js';
import {
  DomainValidationError,
  SeizureOccurrenceType,
  TriggerCause,
} from '../../../src/domain/value-objects/index.js';

const NOW = '2026-08-11T15:00:00.000Z';
const PAST = '2026-08-10T12:30:00.000Z';

function createSeizure(overrides = {}) {
  return new SeizureRecord({
    patientId: 7,
    occurredAt: PAST,
    occurrenceType: SeizureOccurrenceType.FOCAL,
    createdAt: NOW,
    ...overrides,
  });
}

function createTrigger(overrides = {}) {
  return new TriggerRecord({
    patientId: 7,
    recordedAt: PAST,
    commonCause: TriggerCause.SLEEP,
    sleepQuality: 3,
    mood: 4,
    createdAt: NOW,
    ...overrides,
  });
}

describe('clinical record domain rules', () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(NOW));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  describe('seizure validation', () => {
    test.each(Object.values(SeizureOccurrenceType))(
      'accepts the supported %s occurrence type',
      (occurrenceType) => {
        const record = createSeizure({ occurrenceType });

        expect(record).toMatchObject({
          patientId: 7,
          occurredAt: PAST,
          occurrenceType,
          createdAt: NOW,
        });
      },
    );

    test.each([
      ['missing occurrence type', { occurrenceType: undefined }, 'occurrenceType'],
      ['unknown occurrence type', { occurrenceType: 'ABSENCE' }, 'occurrenceType'],
      ['missing occurrence time', { occurredAt: undefined }, 'occurredAt'],
      ['date without time', { occurredAt: '2026-08-10' }, 'occurredAt'],
      ['impossible calendar date', { occurredAt: '2026-02-30T12:00:00.000Z' }, 'occurredAt'],
    ])('rejects %s', (_case, overrides, field) => {
      expect(() => createSeizure(overrides)).toThrow(
        expect.objectContaining({ name: 'DomainValidationError', field }),
      );
    });
  });

  describe('trigger validation', () => {
    test.each(Object.values(TriggerCause))(
      'accepts the supported %s trigger cause',
      (commonCause) => {
        const otherDescription =
          commonCause === TriggerCause.OTHER ? '  Travel fatigue  ' : undefined;
        const record = createTrigger({ commonCause, otherDescription });

        expect(record.commonCause).toBe(commonCause);
        expect(record.otherDescription).toBe(
          commonCause === TriggerCause.OTHER ? 'Travel fatigue' : null,
        );
      },
    );

    test.each([
      ['missing cause', { commonCause: undefined }, 'commonCause'],
      ['unknown cause', { commonCause: 'WEATHER' }, 'commonCause'],
      ['OTHER without a description', { commonCause: TriggerCause.OTHER }, 'otherDescription'],
      [
        'blank OTHER description',
        { commonCause: TriggerCause.OTHER, otherDescription: '  ' },
        'otherDescription',
      ],
      ['non-integer sleep quality', { sleepQuality: 2.5 }, 'sleepQuality'],
      ['missing sleep quality', { sleepQuality: undefined }, 'sleepQuality'],
      ['non-integer mood', { mood: '4' }, 'mood'],
      ['missing mood', { mood: undefined }, 'mood'],
      ['invalid recorded date', { recordedAt: 'not-a-date' }, 'recordedAt'],
    ])('rejects %s', (_case, overrides, field) => {
      expect(() => createTrigger(overrides)).toThrow(
        expect.objectContaining({ name: 'DomainValidationError', field }),
      );
    });
  });

  describe('non-future timestamp boundaries', () => {
    test('allows seizure and trigger timestamps exactly at the current instant', () => {
      expect(createSeizure({ occurredAt: NOW }).occurredAt).toBe(NOW);
      expect(createTrigger({ recordedAt: NOW }).recordedAt).toBe(NOW);
    });

    test.each([
      [
        'seizure occurrence',
        () => createSeizure({ occurredAt: '2026-08-11T15:00:00.001Z' }),
        'occurredAt',
      ],
      [
        'trigger recording',
        () => createTrigger({ recordedAt: '2026-08-11T15:00:00.001Z' }),
        'recordedAt',
      ],
      [
        'seizure creation',
        () => createSeizure({ createdAt: '2026-08-11T15:00:00.001Z' }),
        'createdAt',
      ],
      [
        'trigger creation',
        () => createTrigger({ createdAt: '2026-08-11T15:00:00.001Z' }),
        'createdAt',
      ],
    ])('rejects a future %s timestamp', (_case, createRecord, field) => {
      expect(createRecord).toThrow(
        expect.objectContaining({ name: 'DomainValidationError', field }),
      );
      expect(createRecord).toThrow(/must not be in the future/);
    });
  });

  describe('patient ownership', () => {
    test.each([undefined, null, 0, -1, 1.5, '7'])('rejects invalid patient id %p', (patientId) => {
      for (const createRecord of [createSeizure, createTrigger]) {
        expect(() => createRecord({ patientId })).toThrow(DomainValidationError);
        expect(() => createRecord({ patientId })).toThrow(/patientId/);
      }
    });

    test.each([
      ['seizure', createSeizure],
      ['trigger', createTrigger],
    ])('retains immutable patient ownership for a %s record', (_case, createRecord) => {
      const record = createRecord({ patientId: 42 });

      expect(record.patientId).toBe(42);
      expect(Object.isFrozen(record)).toBe(true);
      expect(Reflect.set(record, 'patientId', 99)).toBe(false);
      expect(record.patientId).toBe(42);
    });
  });
});
