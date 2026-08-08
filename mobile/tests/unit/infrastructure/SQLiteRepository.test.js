import {
  PATIENT_ID_PARAMETER,
  PatientScopedRepository,
  PatientScopeError,
  SQLiteRepository,
} from '../../../src/infrastructure/persistence/repositories/index.js';

function createDatabase() {
  return {
    getAllAsync: jest.fn().mockResolvedValue([]),
    getFirstAsync: jest.fn().mockResolvedValue(null),
    runAsync: jest.fn().mockResolvedValue({ changes: 1, lastInsertRowId: 5 }),
  };
}

function createProvider(database = createDatabase()) {
  return {
    database,
    getDatabase: jest.fn().mockResolvedValue(database),
    withTransaction: jest.fn(async (work) => work(database)),
  };
}

describe('SQLiteRepository', () => {
  test('passes SQL values separately through SQLite parameter binding', async () => {
    const provider = createProvider();
    const repository = new SQLiteRepository({ databaseProvider: provider });
    const parameters = ['$value from a form', 3];

    await repository.run('UPDATE demo SET value = ? WHERE id = ?;', parameters);

    expect(provider.database.runAsync).toHaveBeenCalledWith(
      'UPDATE demo SET value = ? WHERE id = ?;',
      parameters,
    );
  });

  test('delegates transaction work to the database provider', async () => {
    const provider = createProvider();
    const repository = new SQLiteRepository({ databaseProvider: provider });
    const work = jest.fn().mockResolvedValue('committed');

    await expect(repository.withTransaction(work)).resolves.toBe('committed');
    expect(provider.withTransaction).toHaveBeenCalledTimes(1);
    expect(work).toHaveBeenCalledWith(provider.database);
  });

  test.each([
    ['empty SQL', '', []],
    ['string parameters', 'SELECT 1;', 'unsafe'],
    ['null parameters', 'SELECT 1;', null],
  ])('rejects %s before opening the database', async (_case, sql, parameters) => {
    const provider = createProvider();
    const repository = new SQLiteRepository({ databaseProvider: provider });

    await expect(repository.getAll(sql, parameters)).rejects.toThrow(TypeError);
    expect(provider.getDatabase).not.toHaveBeenCalled();
  });
});

describe('PatientScopedRepository', () => {
  const scopedSql = `
    SELECT id, occurred_at
    FROM seizure_records
    WHERE patient_id = ${PATIENT_ID_PARAMETER} AND occurred_at >= $periodStart;
  `;

  test('binds the required patient identifier alongside other named values', async () => {
    const provider = createProvider();
    const repository = new PatientScopedRepository({ databaseProvider: provider });

    await repository.getAllForPatient(7, scopedSql, {
      $periodStart: '2026-08-01T00:00:00.000Z',
    });

    expect(provider.database.getAllAsync).toHaveBeenCalledWith(scopedSql, {
      $periodStart: '2026-08-01T00:00:00.000Z',
      $patientId: 7,
    });
  });

  test.each([undefined, null, 0, -1, 1.5, '1'])(
    'rejects invalid patient id %p',
    async (patientId) => {
      const provider = createProvider();
      const repository = new PatientScopedRepository({ databaseProvider: provider });

      await expect(repository.getAllForPatient(patientId, scopedSql)).rejects.toThrow(
        PatientScopeError,
      );
      expect(provider.getDatabase).not.toHaveBeenCalled();
    },
  );

  test.each([
    'SELECT * FROM seizure_records WHERE patient_id = 7;',
    `SELECT * FROM seizure_records WHERE id = ${PATIENT_ID_PARAMETER};`,
  ])('rejects a clinical query without a complete patient binding: %s', async (sql) => {
    const provider = createProvider();
    const repository = new PatientScopedRepository({ databaseProvider: provider });

    await expect(repository.getAllForPatient(7, sql)).rejects.toThrow(PatientScopeError);
    expect(provider.getDatabase).not.toHaveBeenCalled();
  });

  test('prevents caller parameters from overriding the guarded patient id', async () => {
    const provider = createProvider();
    const repository = new PatientScopedRepository({ databaseProvider: provider });

    await repository.getFirstForPatient(7, scopedSql, { $patientId: 99 });

    expect(provider.database.getFirstAsync).toHaveBeenCalledWith(scopedSql, { $patientId: 7 });
  });

  test('applies the same scope guard to clinical writes', async () => {
    const provider = createProvider();
    const repository = new PatientScopedRepository({ databaseProvider: provider });
    const sql = `INSERT INTO seizure_records (patient_id, occurred_at) VALUES (${PATIENT_ID_PARAMETER}, $occurredAt);`;

    await repository.runForPatient(3, sql, { $occurredAt: '2026-08-01T12:00:00.000Z' });

    expect(provider.database.runAsync).toHaveBeenCalledWith(sql, {
      $occurredAt: '2026-08-01T12:00:00.000Z',
      $patientId: 3,
    });
  });
});
