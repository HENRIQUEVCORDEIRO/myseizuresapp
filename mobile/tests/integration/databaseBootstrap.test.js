import { DatabaseProvider } from '../../src/infrastructure/persistence/sqlite/DatabaseProvider.js';
import { createIdentityFixture } from '../unit/factories/identityFactory.js';
import { createSQLiteTestDatabase } from '../unit/factories/sqliteTestDatabase.js';

const EXPECTED_TABLES = [
  'access_grants',
  'adherence',
  'medic_caretakers',
  'patients',
  'reminders',
  'schema_migrations',
  'seizure_records',
  'treatment_times',
  'treatments',
  'trigger_records',
  'users',
];

async function seedIdentity(database, fixture) {
  for (const user of [fixture.patient.user, fixture.professional.user]) {
    await database.runAsync(
      `INSERT INTO users (id, name, email, password_hash, role, created_at)
       VALUES (?, ?, ?, ?, ?, ?);`,
      user.id,
      user.name,
      user.email,
      user.passwordHash,
      user.role,
      user.createdAt,
    );
  }

  await database.runAsync(
    `INSERT INTO patients (id, user_id, birth_date, diagnosis_date)
     VALUES (?, ?, ?, ?);`,
    fixture.patient.profile.id,
    fixture.patient.profile.userId,
    fixture.patient.profile.birthDate,
    fixture.patient.profile.diagnosisDate,
  );
  await database.runAsync(
    `INSERT INTO medic_caretakers
       (id, user_id, professional_register, professional_link)
     VALUES (?, ?, ?, ?);`,
    fixture.professional.profile.id,
    fixture.professional.profile.userId,
    fixture.professional.profile.professionalRegister,
    fixture.professional.profile.professionalLink,
  );
}

describe('database migration bootstrap', () => {
  let database;

  afterEach(async () => {
    await database?.closeAsync();
  });

  test('applies the complete production schema once and records ordered versions', async () => {
    database = createSQLiteTestDatabase();
    const openDatabase = jest.fn().mockResolvedValue(database);
    const provider = new DatabaseProvider({ openDatabase });

    await provider.initialize();
    await provider.initialize();

    const tables = await database.getAllAsync(
      `SELECT name FROM sqlite_master
       WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
       ORDER BY name;`,
    );
    const versions = await database.getAllAsync(
      'SELECT version, name FROM schema_migrations ORDER BY version;',
    );

    expect(tables.map(({ name }) => name)).toEqual(EXPECTED_TABLES);
    expect(versions).toEqual([
      { version: 1, name: 'identity' },
      { version: 2, name: 'clinical_records_and_treatments' },
    ]);
    expect(openDatabase).toHaveBeenCalledTimes(1);
  });

  test('enforces identity foreign keys and one active authorization per pair', async () => {
    const fixture = createIdentityFixture();
    database = createSQLiteTestDatabase();
    const provider = new DatabaseProvider({
      openDatabase: jest.fn().mockResolvedValue(database),
    });
    await provider.initialize();
    await seedIdentity(database, fixture);

    const insertGrant = () =>
      database.runAsync(
        `INSERT INTO access_grants
           (patient_id, medic_caretaker_id, granted_at, revoked_at)
         VALUES (?, ?, ?, ?);`,
        fixture.authorization.patientId,
        fixture.authorization.medicCaretakerId,
        fixture.authorization.grantedAt,
        null,
      );

    await insertGrant();
    await expect(insertGrant()).rejects.toThrow(/UNIQUE constraint failed/);
    await database.runAsync(
      'UPDATE access_grants SET revoked_at = ? WHERE id = 1;',
      fixture.authorization.revokedAt,
    );
    await expect(insertGrant()).resolves.toMatchObject({ changes: 1 });
    await expect(
      database.runAsync(
        `INSERT INTO patients (user_id, birth_date, diagnosis_date)
         VALUES (?, ?, ?);`,
        9999,
        '1980-01-01',
        null,
      ),
    ).rejects.toThrow(/FOREIGN KEY constraint failed/);
  });
});
