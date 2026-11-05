import { ActivePatientScopeError } from '../../../../src/application/use-cases/clinical/index.js';
import {
  FormDraftType,
  ManageFormDraft,
} from '../../../../src/application/use-cases/drafts/index.js';

const ACTIVE_PATIENT_ID = 7;

function activePatient(patientId = ACTIVE_PATIENT_ID) {
  return jest.fn().mockResolvedValue(patientId);
}

function createRepository() {
  return {
    findDraft: jest.fn().mockResolvedValue(null),
    saveDraft: jest.fn().mockResolvedValue({}),
    clearDraft: jest.fn().mockResolvedValue(true),
  };
}

describe('form draft use cases', () => {
  test('loads, saves, and clears a draft for the active patient', async () => {
    const formDraftRepository = createRepository();
    const useCase = new ManageFormDraft({
      formDraftRepository,
      getActivePatientId: activePatient(),
    });

    await expect(
      useCase.load({ patientId: ACTIVE_PATIENT_ID, formType: FormDraftType.SEIZURE }),
    ).resolves.toBeNull();
    expect(formDraftRepository.findDraft).toHaveBeenCalledWith(
      ACTIVE_PATIENT_ID,
      FormDraftType.SEIZURE,
    );

    const payload = {
      feltAura: true,
      occurredAt: '2026-08-10T12:30:00.000Z',
      occurrenceType: 'FOCAL',
    };

    await useCase.save({
      patientId: ACTIVE_PATIENT_ID,
      formType: FormDraftType.SEIZURE,
      payload,
    });
    expect(formDraftRepository.saveDraft).toHaveBeenCalledWith(
      ACTIVE_PATIENT_ID,
      FormDraftType.SEIZURE,
      payload,
    );

    await expect(
      useCase.clear({ patientId: ACTIVE_PATIENT_ID, formType: FormDraftType.TRIGGER }),
    ).resolves.toBe(true);
    expect(formDraftRepository.clearDraft).toHaveBeenCalledWith(
      ACTIVE_PATIENT_ID,
      FormDraftType.TRIGGER,
    );
  });

  test('rejects an invalid type, payload, and another patient', async () => {
    const formDraftRepository = createRepository();
    const useCase = new ManageFormDraft({
      formDraftRepository,
      getActivePatientId: activePatient(),
    });

    await expect(
      useCase.load({ patientId: ACTIVE_PATIENT_ID, formType: 'TREATMENT' }),
    ).rejects.toBeInstanceOf(TypeError);
    await expect(
      useCase.save({
        patientId: ACTIVE_PATIENT_ID,
        formType: FormDraftType.SEIZURE,
        payload: [],
      }),
    ).rejects.toBeInstanceOf(TypeError);
    await expect(
      useCase.load({ patientId: 99, formType: FormDraftType.SEIZURE }),
    ).rejects.toBeInstanceOf(ActivePatientScopeError);
    expect(formDraftRepository.findDraft).not.toHaveBeenCalled();
    expect(formDraftRepository.saveDraft).not.toHaveBeenCalled();
  });
});
