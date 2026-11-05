import { ManageSupportContact } from '../../../src/application/use-cases/support/index.js';
import { ActivePatientScopeError } from '../../../src/application/use-cases/clinical/index.js';
import { SupportContact } from '../../../src/domain/entities/index.js';

const PATIENT_ID = 7;
const NOW = '2026-10-01T12:00:00.000Z';

function createRepository() {
  return {
    findContact: jest.fn(async () => null),
    saveContact: jest.fn(async (_patientId, contact) => contact),
    clearContact: jest.fn(async () => true),
  };
}

describe('support contact use cases', () => {
  test('loads and clears the contact for the active patient', async () => {
    const repository = createRepository();
    const useCase = new ManageSupportContact({
      supportContactRepository: repository,
      getActivePatientId: jest.fn(async () => PATIENT_ID),
      now: () => NOW,
    });

    await expect(useCase.load({})).resolves.toBeNull();
    await expect(useCase.clear({})).resolves.toBe(true);
    expect(repository.findContact).toHaveBeenCalledWith(PATIENT_ID);
    expect(repository.clearContact).toHaveBeenCalledWith(PATIENT_ID);
  });

  test('validates and saves a normalized contact for the active patient', async () => {
    const repository = createRepository();
    const useCase = new ManageSupportContact({
      supportContactRepository: repository,
      getActivePatientId: jest.fn(async () => PATIENT_ID),
      now: () => NOW,
    });

    const saved = await useCase.save({
      name: '  Maria  ',
      relationship: '  Mãe  ',
      phone: '  (11) 99999-0000  ',
    });

    expect(saved).toBeInstanceOf(SupportContact);
    expect(saved).toMatchObject({
      patientId: PATIENT_ID,
      name: 'Maria',
      relationship: 'Mãe',
      phone: '(11) 99999-0000',
      updatedAt: NOW,
    });
    expect(repository.saveContact).toHaveBeenCalledWith(PATIENT_ID, saved);
  });

  test('rejects invalid contact fields and a different caller-selected patient', async () => {
    const repository = createRepository();
    const useCase = new ManageSupportContact({
      supportContactRepository: repository,
      getActivePatientId: jest.fn(async () => PATIENT_ID),
      now: () => NOW,
    });

    await expect(useCase.save({ name: 'Maria', phone: '' })).rejects.toThrow(/phone/);
    await expect(
      useCase.save({ patientId: 99, name: 'Maria', phone: '11999990000' }),
    ).rejects.toBeInstanceOf(ActivePatientScopeError);
    expect(repository.saveContact).not.toHaveBeenCalled();
  });
});
