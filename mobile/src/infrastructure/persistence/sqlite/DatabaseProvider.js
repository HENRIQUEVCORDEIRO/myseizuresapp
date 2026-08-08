import { openDatabaseAsync } from 'expo-sqlite';

import { migrations } from '../migrations/index.js';
import { runMigrations } from '../migrations/MigrationRunner.js';

export const DEFAULT_DATABASE_NAME = 'myseizures.db';

function validateOptions({ databaseName, openDatabase, migrate, migrationList }) {
  if (typeof databaseName !== 'string' || !databaseName.trim()) {
    throw new TypeError('Database name must be a non-empty string.');
  }

  if (typeof openDatabase !== 'function') {
    throw new TypeError('Database opener must be a function.');
  }

  if (typeof migrate !== 'function') {
    throw new TypeError('Database migration runner must be a function.');
  }

  if (!Array.isArray(migrationList)) {
    throw new TypeError('Database migrations must be an array.');
  }
}

export class DatabaseProvider {
  constructor({
    databaseName = DEFAULT_DATABASE_NAME,
    openDatabase = openDatabaseAsync,
    migrate = runMigrations,
    migrationList = migrations,
  } = {}) {
    validateOptions({ databaseName, openDatabase, migrate, migrationList });

    this.databaseName = databaseName;
    this.openDatabase = openDatabase;
    this.migrate = migrate;
    this.migrationList = migrationList;
    this.initializationPromise = null;
  }

  initialize() {
    if (!this.initializationPromise) {
      this.initializationPromise = this.openAndMigrate();
    }

    return this.initializationPromise;
  }

  getDatabase() {
    return this.initialize();
  }

  async withTransaction(work) {
    if (typeof work !== 'function') {
      throw new TypeError('Transaction work must be a function.');
    }

    const database = await this.initialize();

    if (typeof database.withExclusiveTransactionAsync !== 'function') {
      throw new TypeError('Database must implement withExclusiveTransactionAsync().');
    }

    let result;

    await database.withExclusiveTransactionAsync(async (transaction) => {
      result = await work(transaction);
    });

    return result;
  }

  async openAndMigrate() {
    let database;

    try {
      database = await this.openDatabase(this.databaseName);
      await this.migrate(database, this.migrationList);
      return database;
    } catch (error) {
      this.initializationPromise = null;

      if (typeof database?.closeAsync === 'function') {
        try {
          await database.closeAsync();
        } catch {
          // Preserve the initialization error, which is the actionable failure for callers.
        }
      }

      throw error;
    }
  }
}

export const databaseProvider = new DatabaseProvider();
