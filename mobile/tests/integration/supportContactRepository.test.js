import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { SupportContact } from '../../src/domain/entities/index.js';
import { SupportContactRepository } from '../../src/infrastructure/persistence/repositories/SupportContactRepository.js';
import { DatabaseProvider } from '../../src/infrastructure/persistence/sqlite/DatabaseProvider.js';
import { createSQLiteTestDatabase } from '../unit/factories/sqliteTestDatabase.js';

const UPDATED_AT = '2026-10-01T12:00:00.000Z';

async function createProvider(databasePath) {
  const database = createSQLiteTestDatabase(databasePath);
  const provider = new DatabaseProvider({
    databaseName: databasePath,
    openDatabase: jest.fn().mockResolvedValue(database),
  });

  await provider.initialize();
  return { database, provider };
}

async function seedPatients(database) {
  for (const patientId of [1, 2]) {
    await database.runAsync(
      `INSERT INTO users (id, name, email, password_hash, role, created_at)
       VALUES (?, ?, ?, ?, 'PATIENT', ?);`,
      patientId,
      `Patient ${patientId}`,
      `patient${patientId}@example.test`,
      'test-hash',
      UPDATED_AT,
    );
    await database.runAsync(
      `INSERT INTO patients (id, user_id, birth_date, diagnosis_date)
       VALUES (?, ?, '1980-01-01', NULL);`,
      patientId,
      patientId,
    );
  }
}

describe('support contact SQLite repository', () => {
  let database;
  let temporaryDirectory;
  let databasePath;

  beforeEach(() => {
    temporaryDirectory = mkdtempSync(join(tmpdir(), 'myseizures-support-contact-'));
    databasePath = join(temporaryDirectory, 'support-contact.db');
  });

  afterEach(async () => {
    await database?.closeAsync();
    rmSync(temporaryDirectory, { force: true, recursive: true });
  });

  test('saves, updates, isolates, and removes one local contact per patient', async () => {
    const launch = await createProvider(databasePath);
    database = launch.database;
    await seedPatients(database);
    const repository = new SupportContactRepository({ databaseProvider: launch.provider });
    const contact = new SupportContact({
      patientId: 1,
      name: '  Maria  ',
      relationship: '  Mãe  ',
      phone: '  (11) 99999-0000  ',
      updatedAt: UPDATED_AT,
    });

    await expect(repository.saveContact(1, contact)).resolves.toEqual(contact);
    await expect(repository.findContact(1)).resolves.toEqual(contact);
    await expect(repository.findContact(2)).resolves.toBeNull();
    await expect(repository.clearContact(2)).resolves.toBe(false);

    const updated = new SupportContact({
      patientId: 1,
      name: 'João',
      relationship: null,
      phone: '11988887777',
      updatedAt: '2026-10-02T12:00:00.000Z',
    });

    await expect(repository.saveContact(1, updated)).resolves.toEqual(updated);
    await expect(repository.findContact(1)).resolves.toEqual(updated);
    await expect(
      database.getAllAsync(
        'SELECT patient_id, name, relationship, phone, updated_at FROM support_contacts;',
      ),
    ).resolves.toEqual([
      {
        patient_id: 1,
        name: 'João',
        relationship: null,
        phone: '11988887777',
        updated_at: '2026-10-02T12:00:00.000Z',
      },
    ]);

    await expect(repository.clearContact(1)).resolves.toBe(true);
    await expect(repository.findContact(1)).resolves.toBeNull();
  });

  test('rejects a contact from another patient', async () => {
    const launch = await createProvider(databasePath);
    database = launch.database;
    await seedPatients(database);
    const repository = new SupportContactRepository({ databaseProvider: launch.provider });
    const contact = new SupportContact({
      patientId: 2,
      name: 'Maria',
      phone: '11999990000',
      updatedAt: UPDATED_AT,
    });

    await expect(repository.saveContact(1, contact)).rejects.toThrow(/another patient/);
  });
});
