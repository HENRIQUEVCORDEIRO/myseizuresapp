import { Adherence, Reminder, Treatment } from '../../../src/domain/entities/index.js';
import {
  calculateAdherenceRate,
  confirmReminder,
  generateReminderSchedule,
} from '../../../src/domain/rules/index.js';
import {
  ConsumptionStatus,
  DomainValidationError,
  ReminderStatus,
  TreatmentType,
} from '../../../src/domain/value-objects/index.js';

const NOW = '2026-08-20T12:00:00.000Z';

function createTreatment(overrides = {}) {
  return new Treatment({
    id: 11,
    patientId: 7,
    type: TreatmentType.MEDICATION,
    name: 'Levetiracetam',
    dailyFrequency: 2,
    baseTimes: ['08:00', '20:00'],
    ...overrides,
  });
}

function createReminder(overrides = {}) {
  return new Reminder({
    id: 31,
    treatmentId: 11,
    scheduledAt: '2026-08-20T08:00:00.000Z',
    ...overrides,
  });
}

function createAdherence(reminderId, consumptionStatus) {
  return new Adherence({
    reminderId,
    confirmedAt: NOW,
    consumptionStatus,
  });
}

describe('treatment domain rules', () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(NOW));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  describe('treatment validation', () => {
    test('accepts a complete treatment and normalizes its name', () => {
      expect(createTreatment({ name: '  Levetiracetam  ' })).toMatchObject({
        patientId: 7,
        type: TreatmentType.MEDICATION,
        name: 'Levetiracetam',
        active: true,
      });
    });

    test.each([
      ['missing patient', { patientId: undefined }, 'patientId'],
      ['missing name', { name: '  ' }, 'name'],
      ['unknown type', { type: 'SUPPLEMENT' }, 'type'],
      ['zero frequency', { dailyFrequency: 0 }, 'dailyFrequency'],
      ['fractional frequency', { dailyFrequency: 1.5 }, 'dailyFrequency'],
      ['no base times', { baseTimes: [] }, 'baseTimes'],
      ['malformed base time', { baseTimes: ['8:00'] }, 'baseTimes'],
      ['duplicate base time', { baseTimes: ['08:00', '08:00'] }, 'baseTimes'],
      ['frequency and base-time mismatch', { dailyFrequency: 1 }, 'baseTimes'],
    ])('rejects %s', (_case, overrides, field) => {
      expect(() => createTreatment(overrides)).toThrow(
        expect.objectContaining({ name: 'DomainValidationError', field }),
      );
    });
  });

  describe('reminder generation', () => {
    test('generates future reminders in chronological order from each base time', () => {
      const reminders = generateReminderSchedule({
        treatment: createTreatment({ baseTimes: ['20:00', '08:00'] }),
        from: '2026-08-20T12:00:00.000Z',
        days: 2,
      });

      expect(
        reminders.map(({ treatmentId, scheduledAt, status }) => ({
          treatmentId,
          scheduledAt,
          status,
        })),
      ).toEqual([
        {
          treatmentId: 11,
          scheduledAt: '2026-08-20T20:00:00.000Z',
          status: ReminderStatus.SCHEDULED,
        },
        {
          treatmentId: 11,
          scheduledAt: '2026-08-21T08:00:00.000Z',
          status: ReminderStatus.SCHEDULED,
        },
        {
          treatmentId: 11,
          scheduledAt: '2026-08-21T20:00:00.000Z',
          status: ReminderStatus.SCHEDULED,
        },
      ]);
      expect(Object.isFrozen(reminders)).toBe(true);
    });

    test('includes a reminder exactly on the lower scheduling boundary', () => {
      const reminders = generateReminderSchedule({
        treatment: createTreatment(),
        from: '2026-08-20T08:00:00.000Z',
      });

      expect(reminders.map((reminder) => reminder.scheduledAt)).toEqual([
        '2026-08-20T08:00:00.000Z',
        '2026-08-20T20:00:00.000Z',
      ]);
    });

    test('does not generate reminders for an inactive treatment', () => {
      expect(
        generateReminderSchedule({
          treatment: createTreatment({ active: false }),
          from: NOW,
          days: 7,
        }),
      ).toEqual([]);
    });

    test.each([
      ['an unsaved treatment', { treatment: createTreatment({ id: undefined }), from: NOW }],
      ['a malformed start time', { treatment: createTreatment(), from: '2026-08-20' }],
      ['a zero-day horizon', { treatment: createTreatment(), from: NOW, days: 0 }],
    ])('rejects %s', (_case, input) => {
      expect(() => generateReminderSchedule(input)).toThrow(DomainValidationError);
    });
  });

  describe('idempotent confirmation', () => {
    test.each([ConsumptionStatus.TAKEN, ConsumptionStatus.MISSED])(
      'records one final %s confirmation',
      (consumptionStatus) => {
        const result = confirmReminder({
          reminder: createReminder(),
          consumptionStatus,
          confirmedAt: NOW,
        });

        expect(result.created).toBe(true);
        expect(result.reminder.status).toBe(consumptionStatus);
        expect(result.adherence).toMatchObject({
          reminderId: 31,
          confirmedAt: NOW,
          consumptionStatus,
        });
      },
    );

    test('returns the existing confirmation when the same action is repeated', () => {
      const existingAdherence = createAdherence(31, ConsumptionStatus.TAKEN);
      const finalReminder = createReminder({ status: ReminderStatus.TAKEN });

      const result = confirmReminder({
        reminder: finalReminder,
        consumptionStatus: ConsumptionStatus.TAKEN,
        confirmedAt: NOW,
        existingAdherence,
      });

      expect(result).toEqual({
        reminder: finalReminder,
        adherence: existingAdherence,
        created: false,
      });
      expect(result.adherence).toBe(existingAdherence);
    });

    test('rejects an attempt to change a final confirmation', () => {
      expect(() =>
        confirmReminder({
          reminder: createReminder({ status: ReminderStatus.TAKEN }),
          consumptionStatus: ConsumptionStatus.MISSED,
          confirmedAt: NOW,
          existingAdherence: createAdherence(31, ConsumptionStatus.TAKEN),
        }),
      ).toThrow(/cannot replace a final reminder confirmation/);
    });

    test('rejects a future confirmation timestamp', () => {
      expect(() =>
        confirmReminder({
          reminder: createReminder(),
          consumptionStatus: ConsumptionStatus.TAKEN,
          confirmedAt: '2026-08-20T12:00:00.001Z',
        }),
      ).toThrow(/must not be in the future/);
    });
  });

  describe('adherence rate', () => {
    test.each([
      ['no final confirmations', [], undefined],
      [
        'all doses taken',
        [createAdherence(1, ConsumptionStatus.TAKEN), createAdherence(2, ConsumptionStatus.TAKEN)],
        100,
      ],
      [
        'all doses missed',
        [
          createAdherence(1, ConsumptionStatus.MISSED),
          createAdherence(2, ConsumptionStatus.MISSED),
        ],
        0,
      ],
      [
        'mixed final confirmations',
        [
          createAdherence(1, ConsumptionStatus.TAKEN),
          createAdherence(2, ConsumptionStatus.MISSED),
          createAdherence(3, ConsumptionStatus.TAKEN),
          createAdherence(4, ConsumptionStatus.MISSED),
        ],
        50,
      ],
    ])('calculates %s', (_case, confirmations, expectedRate) => {
      expect(calculateAdherenceRate(confirmations)).toBe(expectedRate);
    });

    test('rejects duplicate final confirmations for one reminder', () => {
      expect(() =>
        calculateAdherenceRate([
          createAdherence(1, ConsumptionStatus.TAKEN),
          createAdherence(1, ConsumptionStatus.MISSED),
        ]),
      ).toThrow(/at most one final confirmation per reminder/);
    });
  });
});
