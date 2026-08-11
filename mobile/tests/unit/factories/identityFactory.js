import { UserRole } from '../../../src/domain/value-objects/index.js';

const CREATED_AT = '2026-08-01T12:00:00.000Z';

export function createIdentityFixture({
  patientUser = {},
  patientProfile = {},
  professionalUser = {},
  professionalProfile = {},
  authorization = {},
} = {}) {
  const patient = {
    user: {
      id: 1,
      name: 'Test Patient',
      email: 'patient.fixture@example.com',
      passwordHash: 'test-only-patient-hash',
      role: UserRole.PATIENT,
      createdAt: CREATED_AT,
      ...patientUser,
    },
    profile: {
      id: 1,
      userId: 1,
      birthDate: '1980-01-01',
      diagnosisDate: '2010-06-15',
      ...patientProfile,
    },
  };
  const professional = {
    user: {
      id: 2,
      name: 'Test Professional',
      email: 'professional.fixture@example.com',
      passwordHash: 'test-only-professional-hash',
      role: UserRole.MEDIC_CARETAKER,
      createdAt: CREATED_AT,
      ...professionalUser,
    },
    profile: {
      id: 1,
      userId: 2,
      professionalRegister: 123456,
      professionalLink: 'Neurology clinic',
      ...professionalProfile,
    },
  };

  return {
    patient,
    professional,
    authorization: {
      patientId: patient.profile.id,
      medicCaretakerId: professional.profile.id,
      grantedAt: '2026-08-02T12:00:00.000Z',
      revokedAt: '2026-08-03T12:00:00.000Z',
      ...authorization,
    },
  };
}
