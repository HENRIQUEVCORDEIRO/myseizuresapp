import {
  DatabaseProvider,
  DEFAULT_DATABASE_NAME,
} from '../../../src/infrastructure/persistence/sqlite/DatabaseProvider.js';

function createDatabase() {
  return {
    closeAsync: jest.fn().mockResolvedValue(undefined),
    withExclusiveTransactionAsync: jest.fn(async (work) => work({ connection: 'transaction' })),
  };
}

describe('DatabaseProvider', () => {
  test('opens and migrates the database only once for concurrent and later callers', async () => {
    const database = createDatabase();
    const openDatabase = jest.fn().mockResolvedValue(database);
    const migrate = jest.fn().mockResolvedValue(undefined);
    const migrationList = [{ version: 1 }];
    const provider = new DatabaseProvider({ openDatabase, migrate, migrationList });

    const [first, second] = await Promise.all([provider.initialize(), provider.getDatabase()]);
    const third = await provider.initialize();

    expect(first).toBe(database);
    expect(second).toBe(database);
    expect(third).toBe(database);
    expect(openDatabase).toHaveBeenCalledTimes(1);
    expect(openDatabase).toHaveBeenCalledWith(DEFAULT_DATABASE_NAME);
    expect(migrate).toHaveBeenCalledTimes(1);
    expect(migrate).toHaveBeenCalledWith(database, migrationList);
  });

  test('runs work with the initialized exclusive transaction and returns its result', async () => {
    const database = createDatabase();
    const provider = new DatabaseProvider({
      openDatabase: jest.fn().mockResolvedValue(database),
      migrate: jest.fn().mockResolvedValue(undefined),
      migrationList: [],
    });
    const work = jest.fn().mockResolvedValue('saved');

    await expect(provider.withTransaction(work)).resolves.toBe('saved');

    expect(database.withExclusiveTransactionAsync).toHaveBeenCalledTimes(1);
    expect(work).toHaveBeenCalledWith({ connection: 'transaction' });
  });

  test('rejects invalid transaction work before opening the database', async () => {
    const openDatabase = jest.fn();
    const provider = new DatabaseProvider({
      openDatabase,
      migrate: jest.fn(),
      migrationList: [],
    });

    await expect(provider.withTransaction(null)).rejects.toThrow(
      'Transaction work must be a function.',
    );
    expect(openDatabase).not.toHaveBeenCalled();
  });

  test('closes a failed connection and permits a clean initialization retry', async () => {
    const firstDatabase = createDatabase();
    const secondDatabase = createDatabase();
    const openDatabase = jest
      .fn()
      .mockResolvedValueOnce(firstDatabase)
      .mockResolvedValueOnce(secondDatabase);
    const migrationError = new Error('migration failed');
    const migrate = jest
      .fn()
      .mockRejectedValueOnce(migrationError)
      .mockResolvedValueOnce(undefined);
    const provider = new DatabaseProvider({ openDatabase, migrate, migrationList: [] });

    await expect(provider.initialize()).rejects.toBe(migrationError);
    await expect(provider.initialize()).resolves.toBe(secondDatabase);

    expect(firstDatabase.closeAsync).toHaveBeenCalledTimes(1);
    expect(secondDatabase.closeAsync).not.toHaveBeenCalled();
    expect(openDatabase).toHaveBeenCalledTimes(2);
    expect(migrate).toHaveBeenCalledTimes(2);
  });
});
