import { SupportContact } from '../../../domain/entities/index.js';
import { PatientScopeError, PatientScopedRepository } from './PatientScopedRepository.js';

const SELECT_COLUMNS = `
  SELECT patient_id, name, relationship, phone, updated_at
  FROM support_contacts
`;

function requireSupportContact(value) {
  if (!(value instanceof SupportContact)) {
    throw new TypeError('Support contact repository requires a SupportContact.');
  }

  return value;
}

function toEntity(row) {
  return new SupportContact({
    patientId: row.patient_id,
    name: row.name,
    relationship: row.relationship,
    phone: row.phone,
    updatedAt: row.updated_at,
  });
}

export class SupportContactRepository extends PatientScopedRepository {
  async findContact(patientId) {
    const row = await this.getFirstForPatient(
      patientId,
      `${SELECT_COLUMNS}
       WHERE patient_id = $patientId;`,
    );

    return row ? toEntity(row) : null;
  }

  async saveContact(patientId, value) {
    const contact = requireSupportContact(value);

    if (contact.patientId !== patientId) {
      throw new PatientScopeError('Support contact belongs to another patient.');
    }

    await this.runForPatient(
      patientId,
      `INSERT INTO support_contacts (patient_id, name, relationship, phone, updated_at)
       VALUES ($patientId, $name, $relationship, $phone, $updatedAt)
       ON CONFLICT(patient_id) DO UPDATE SET
         name = excluded.name,
         relationship = excluded.relationship,
         phone = excluded.phone,
         updated_at = excluded.updated_at;`,
      {
        $name: contact.name,
        $relationship: contact.relationship,
        $phone: contact.phone,
        $updatedAt: contact.updatedAt,
      },
    );

    return contact;
  }

  async clearContact(patientId) {
    const result = await this.runForPatient(
      patientId,
      `DELETE FROM support_contacts
       WHERE patient_id = $patientId;`,
    );

    return result.changes > 0;
  }
}
