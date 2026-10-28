import { migrations } from '../../src/infrastructure/persistence/migrations/index.js';
import { runMigrations } from '../../src/infrastructure/persistence/migrations/MigrationRunner.js';
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
    const seizureColumns = await database.getAllAsync('PRAGMA table_info(seizure_records);');

    expect(tables.map(({ name }) => name)).toEqual(EXPECTED_TABLES);
    expect(versions).toEqual([
      { version: 1, name: 'identity' },
      { version: 2, name: 'clinical_records_and_treatments' },
      { version: 3, name: 'seizure_aura' },
    ]);
    expect(seizureColumns).toContainEqual(
      expect.objectContaining({
        name: 'felt_aura',
        notnull: 1,
        dflt_value: '0',
      }),
    );
    expect(openDatabase).toHaveBeenCalledTimes(1);
  });

  test('adds the aura column without losing seizures created before the migration', async () => {
    database = createSQLiteTestDatabase();
    await runMigrations(database, migrations.slice(0, 2));

    await database.runAsync(
      `INSERT INTO users (id, name, email, password_hash, role, created_at)
       VALUES (1, 'Patient', 'patient@example.test', 'test-hash', 'PATIENT', ?);`,
      '2026-07-01T00:00:00.000Z',
    );
    await database.runAsync(
      `INSERT INTO patients (id, user_id, birth_date, diagnosis_date)
       VALUES (1, 1, '1980-01-01', NULL);`,
    );
    await database.runAsync(
      `INSERT INTO seizure_records (patient_id, occurred_at, occurrence_type, created_at)
       VALUES (1, ?, 'FOCAL', ?);`,
      '2026-07-10T08:30:00.000Z',
      '2026-07-10T08:35:00.000Z',
    );

    await runMigrations(database, migrations);

    await expect(
      database.getFirstAsync('SELECT felt_aura FROM seizure_records WHERE id = 1;'),
    ).resolves.toEqual({ felt_aura: 0 });
    await expect(
      database.getAllAsync('SELECT version FROM schema_migrations ORDER BY version;'),
    ).resolves.toEqual([{ version: 1 }, { version: 2 }, { version: 3 }]);
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
