import {
  ActivePatientScopeError,
  ClinicalEventType,
  ListChronologicalEvents,
  RecordSeizure,
  RecordTrigger,
} from '../../../../src/application/use-cases/clinical/index.js';
import { SeizureRecord, TriggerRecord } from '../../../../src/domain/entities/index.js';
import {
  DomainValidationError,
  SeizureOccurrenceType,
  TriggerCause,
} from '../../../../src/domain/value-objects/index.js';

const ACTIVE_PATIENT_ID = 7;
const NOW = '2026-08-11T15:00:00.000Z';

function activePatient(patientId = ACTIVE_PATIENT_ID) {
  return jest.fn().mockResolvedValue(patientId);
}

describe('clinical record use cases', () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(NOW));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  test('RecordSeizure validates and saves a record for the active patient', async () => {
    const seizureRepository = {
      saveSeizure: jest.fn(async (record) => new SeizureRecord({ ...record, id: 101 })),
    };
    const useCase = new RecordSeizure({
      seizureRepository,
      getActivePatientId: activePatient(),
      now: () => NOW,
    });

    const saved = await useCase.execute({
      patientId: ACTIVE_PATIENT_ID,
      occurredAt: '2026-08-10T12:30:00.000Z',
      occurrenceType: SeizureOccurrenceType.FOCAL,
    });

    expect(saved).toBeInstanceOf(SeizureRecord);
    expect(saved).toMatchObject({ id: 101, patientId: ACTIVE_PATIENT_ID, createdAt: NOW });
    expect(seizureRepository.saveSeizure).toHaveBeenCalledWith(
      expect.objectContaining({ patientId: ACTIVE_PATIENT_ID }),
    );
  });

  test('RecordSeizure rejects invalid data and a different caller-selected patient', async () => {
    const seizureRepository = { saveSeizure: jest.fn() };
    const useCase = new RecordSeizure({
      seizureRepository,
      getActivePatientId: activePatient(),
      now: () => NOW,
    });

    await expect(
      useCase.execute({ occurredAt: 'invalid', occurrenceType: SeizureOccurrenceType.FOCAL }),
    ).rejects.toBeInstanceOf(DomainValidationError);
    await expect(
      useCase.execute({
        patientId: 99,
        occurredAt: '2026-08-10T12:30:00.000Z',
        occurrenceType: SeizureOccurrenceType.FOCAL,
      }),
    ).rejects.toBeInstanceOf(ActivePatientScopeError);
    expect(seizureRepository.saveSeizure).not.toHaveBeenCalled();
  });

  test('RecordTrigger validates and saves all details for the active patient', async () => {
    const triggerRepository = {
      saveTrigger: jest.fn(async (record) => new TriggerRecord({ ...record, id: 202 })),
    };
    const useCase = new RecordTrigger({
      triggerRepository,
      getActivePatientId: activePatient(),
      now: () => NOW,
    });

    const saved = await useCase.execute({
      patientId: ACTIVE_PATIENT_ID,
      recordedAt: '2026-08-10T13:00:00.000Z',
      commonCause: TriggerCause.OTHER,
      otherDescription: 'Travel fatigue',
      sleepQuality: 2,
      mood: 3,
    });

    expect(saved).toBeInstanceOf(TriggerRecord);
    expect(saved).toMatchObject({
      id: 202,
      patientId: ACTIVE_PATIENT_ID,
      otherDescription: 'Travel fatigue',
      createdAt: NOW,
    });
  });

  test('RecordTrigger rejects invalid data and a different caller-selected patient', async () => {
    const triggerRepository = { saveTrigger: jest.fn() };
    const useCase = new RecordTrigger({
      triggerRepository,
      getActivePatientId: activePatient(),
      now: () => NOW,
    });

    await expect(
      useCase.execute({
        recordedAt: '2026-08-10T13:00:00.000Z',
        commonCause: TriggerCause.OTHER,
        sleepQuality: 2,
        mood: 3,
      }),
    ).rejects.toBeInstanceOf(DomainValidationError);
    await expect(
      useCase.execute({
        patientId: 99,
        recordedAt: '2026-08-10T13:00:00.000Z',
        commonCause: TriggerCause.SLEEP,
        sleepQuality: 2,
        mood: 3,
      }),
    ).rejects.toBeInstanceOf(ActivePatientScopeError);
    expect(triggerRepository.saveTrigger).not.toHaveBeenCalled();
  });

  test('ListChronologicalEvents returns only active-patient events in timestamp order', async () => {
    const activeSeizure = new SeizureRecord({
      id: 2,
      patientId: ACTIVE_PATIENT_ID,
      occurredAt: '2026-08-10T12:00:00.000Z',
      occurrenceType: SeizureOccurrenceType.GENERALIZED,
      createdAt: NOW,
    });
    const otherPatientSeizure = new SeizureRecord({
      id: 3,
      patientId: 99,
      occurredAt: '2026-08-10T10:00:00.000Z',
      occurrenceType: SeizureOccurrenceType.FOCAL,
      createdAt: NOW,
    });
    const activeTrigger = new TriggerRecord({
      id: 4,
      patientId: ACTIVE_PATIENT_ID,
      recordedAt: '2026-08-10T11:00:00.000Z',
      commonCause: TriggerCause.SLEEP,
      sleepQuality: 2,
      mood: 3,
      createdAt: NOW,
    });
    const seizureRepository = {
      listSeizuresByPeriod: jest.fn().mockResolvedValue([activeSeizure, otherPatientSeizure]),
    };
    const triggerRepository = {
      listTriggersByPeriod: jest.fn().mockResolvedValue([activeTrigger]),
    };
    const useCase = new ListChronologicalEvents({
      seizureRepository,
      triggerRepository,
      getActivePatientId: activePatient(),
    });
    const period = {
      periodStart: '2026-08-10T00:00:00.000Z',
      periodEnd: '2026-08-10T23:59:59.999Z',
    };

    const events = await useCase.execute({ patientId: ACTIVE_PATIENT_ID, ...period });

    expect(seizureRepository.listSeizuresByPeriod).toHaveBeenCalledWith(ACTIVE_PATIENT_ID, period);
    expect(triggerRepository.listTriggersByPeriod).toHaveBeenCalledWith(ACTIVE_PATIENT_ID, period);
    expect(events).toEqual([
      {
        eventType: ClinicalEventType.TRIGGER,
        occurredAt: activeTrigger.recordedAt,
        record: activeTrigger,
      },
      {
        eventType: ClinicalEventType.SEIZURE,
        occurredAt: activeSeizure.occurredAt,
        record: activeSeizure,
      },
    ]);
  });

  test('ListChronologicalEvents validates its period and active-patient scope', async () => {
    const seizureRepository = { listSeizuresByPeriod: jest.fn() };
    const triggerRepository = { listTriggersByPeriod: jest.fn() };
    const useCase = new ListChronologicalEvents({
      seizureRepository,
      triggerRepository,
      getActivePatientId: activePatient(),
    });

    await expect(
      useCase.execute({
        periodStart: '2026-08-11T00:00:00.000Z',
        periodEnd: '2026-08-10T00:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(RangeError);
    await expect(
      useCase.execute({
        patientId: 99,
        periodStart: '2026-08-10T00:00:00.000Z',
        periodEnd: '2026-08-11T00:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(ActivePatientScopeError);
    expect(seizureRepository.listSeizuresByPeriod).not.toHaveBeenCalled();
    expect(triggerRepository.listTriggersByPeriod).not.toHaveBeenCalled();
  });
});
