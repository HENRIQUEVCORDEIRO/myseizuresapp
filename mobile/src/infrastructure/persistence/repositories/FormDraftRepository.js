import { PatientScopedRepository } from './PatientScopedRepository.js';

const FORM_TYPES = new Set(['SEIZURE', 'TRIGGER']);

function requireFormType(value) {
  if (!FORM_TYPES.has(value)) {
    throw new TypeError('Form draft type must be SEIZURE or TRIGGER.');
  }

  return value;
}

function requirePayload(value) {
  const isPlainObject =
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);

  if (!isPlainObject) {
    throw new TypeError('Form draft payload must be a plain object.');
  }

  try {
    JSON.stringify(value);
  } catch (error) {
    throw new TypeError('Form draft payload must be JSON serializable.', { cause: error });
  }

  return value;
}

function parseDraft(row, formType) {
  let payload;

  try {
    payload = JSON.parse(row.payload);
  } catch (error) {
    throw new TypeError('Stored form draft payload must be valid JSON.', { cause: error });
  }

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new TypeError('Stored form draft payload must be an object.');
  }

  return Object.freeze({
    formType,
    payload: Object.freeze(payload),
    updatedAt: row.updated_at,
  });
}

export class FormDraftRepository extends PatientScopedRepository {
  constructor({ databaseProvider, now = () => new Date().toISOString() } = {}) {
    super({ databaseProvider });

    if (typeof now !== 'function') {
      throw new TypeError('Form draft clock must be a function.');
    }

    this.now = now;
  }

  async findDraft(patientId, formTypeValue) {
    const formType = requireFormType(formTypeValue);
    const row = await this.getFirstForPatient(
      patientId,
      `SELECT payload, updated_at
       FROM form_drafts
       WHERE patient_id = $patientId AND form_type = $formType;`,
      { $formType: formType },
    );

    return row ? parseDraft(row, formType) : null;
  }

  async saveDraft(patientId, formTypeValue, payloadValue) {
    const formType = requireFormType(formTypeValue);
    const payload = requirePayload(payloadValue);
    const updatedAt = this.now();

    await this.runForPatient(
      patientId,
      `INSERT INTO form_drafts (patient_id, form_type, payload, updated_at)
       VALUES ($patientId, $formType, $payload, $updatedAt)
       ON CONFLICT(patient_id, form_type) DO UPDATE SET
         payload = excluded.payload,
         updated_at = excluded.updated_at;`,
      {
        $formType: formType,
        $payload: JSON.stringify(payload),
        $updatedAt: updatedAt,
      },
    );

    return Object.freeze({
      formType,
      payload: Object.freeze({ ...payload }),
      updatedAt,
    });
  }

  async clearDraft(patientId, formTypeValue) {
    const formType = requireFormType(formTypeValue);
    const result = await this.runForPatient(
      patientId,
      `DELETE FROM form_drafts
       WHERE patient_id = $patientId AND form_type = $formType;`,
      { $formType: formType },
    );

    return result.changes > 0;
  }
}
