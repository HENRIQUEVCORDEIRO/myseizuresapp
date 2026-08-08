import {
  AccessGrant,
  Adherence,
  Reminder,
  SeizureRecord,
  Treatment,
  TriggerRecord,
  User,
} from '../../../src/domain/entities/index.js';
import {
  ConsumptionStatus,
  ReminderStatus,
  SeizureOccurrenceType,
  TreatmentType,
  TriggerCause,
  UserRole,
} from '../../../src/domain/value-objects/index.js';

const pastTimestamp = '2026-01-01T12:00:00.000Z';

describe('shared domain validation', () => {
  test('accepts known roles and rejects unknown roles', () => {
    const user = new User({
      name: 'Patient',
      email: 'PATIENT@example.com',
      passwordHash: 'hash',
      role: UserRole.PATIENT,
    });

    expect(user.email).toBe('patient@example.com');
    expect(() => new User({ ...user, id: undefined, role: 'ADMIN' })).toThrow(/role/);
  });

  test('rejects malformed and future clinical timestamps', () => {
    const validRecord = {
      patientId: 1,
      occurrenceType: SeizureOccurrenceType.FOCAL,
      createdAt: pastTimestamp,
    };

    expect(() => new SeizureRecord({ ...validRecord, occurredAt: '2026-01-01' })).toThrow(
      /occurredAt/,
    );
    expect(
      () => new SeizureRecord({ ...validRecord, occurredAt: '2026-02-30T12:00:00.000Z' }),
    ).toThrow(/valid timestamp/);
    expect(
      () =>
        new SeizureRecord({
          ...validRecord,
          occurredAt: new Date(Date.now() + 60_000).toISOString(),
        }),
    ).toThrow(/future/);
  });

  test('rejects unknown enums and incomplete other trigger details', () => {
    const trigger = {
      patientId: 1,
      recordedAt: pastTimestamp,
      sleepQuality: 3,
      mood: 4,
      createdAt: pastTimestamp,
    };

    expect(() => new TriggerRecord({ ...trigger, commonCause: 'INVALID' })).toThrow(/commonCause/);
    expect(() => new TriggerRecord({ ...trigger, commonCause: TriggerCause.OTHER })).toThrow(
      /otherDescription/,
    );
  });

  test('rejects invalid treatment frequency, type, and base times', () => {
    const treatment = {
      patientId: 1,
      type: TreatmentType.MEDICATION,
      name: 'Medication',
      dailyFrequency: 1,
      baseTimes: ['08:00'],
    };

    expect(() => new Treatment({ ...treatment, dailyFrequency: 0 })).toThrow(/dailyFrequency/);
    expect(() => new Treatment({ ...treatment, type: 'INVALID' })).toThrow(/type/);
    expect(() => new Treatment({ ...treatment, baseTimes: ['25:00'] })).toThrow(/baseTimes/);
  });

  test('rejects invalid reminder and adherence statuses', () => {
    expect(
      () => new Reminder({ treatmentId: 1, scheduledAt: pastTimestamp, status: 'INVALID' }),
    ).toThrow(/status/);
    expect(
      () =>
        new Adherence({
          reminderId: 1,
          confirmedAt: pastTimestamp,
          consumptionStatus: 'INVALID',
        }),
    ).toThrow(/consumptionStatus/);

    expect(
      new Reminder({
        treatmentId: 1,
        scheduledAt: pastTimestamp,
        status: ReminderStatus.SCHEDULED,
      }).status,
    ).toBe(ReminderStatus.SCHEDULED);
    expect(
      new Adherence({
        reminderId: 1,
        confirmedAt: pastTimestamp,
        consumptionStatus: ConsumptionStatus.TAKEN,
      }).consumptionStatus,
    ).toBe(ConsumptionStatus.TAKEN);
  });

  test('derives access-grant activity from revocation time', () => {
    expect(
      new AccessGrant({ patientId: 1, medicCaretakerId: 2, grantedAt: pastTimestamp }).isActive,
    ).toBe(true);
    expect(
      new AccessGrant({
        patientId: 1,
        medicCaretakerId: 2,
        grantedAt: '2025-01-01T12:00:00.000Z',
        revokedAt: pastTimestamp,
      }).isActive,
    ).toBe(false);
  });
});
