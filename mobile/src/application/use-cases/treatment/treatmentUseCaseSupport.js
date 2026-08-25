import { TreatmentRepositoryPort } from '../../ports/index.js';

export function treatmentContext({ treatmentRepository, getActivePatientId }) {
  TreatmentRepositoryPort.assert(treatmentRepository);
  if (typeof getActivePatientId !== 'function')
    throw new TypeError('Active patient resolver is required.');
  return {
    treatmentRepository,
    getPatientId: () => {
      const id = getActivePatientId();
      if (!Number.isInteger(id) || id < 1)
        throw new TypeError('Active patient id must be positive.');
      return id;
    },
  };
}
