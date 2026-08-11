import { DatabaseSync } from 'node:sqlite';

function normalizeParameters(parameters) {
  if (parameters.length === 1 && Array.isArray(parameters[0])) {
    return parameters[0];
  }

  return parameters;
}

export function createSQLiteTestDatabase() {
  const connection = new DatabaseSync(':memory:');

  return {
    async execAsync(sql) {
      connection.exec(sql);
    },

    async getAllAsync(sql, ...parameters) {
      return connection.prepare(sql).all(...normalizeParameters(parameters));
    },

    async getFirstAsync(sql, ...parameters) {
      return connection.prepare(sql).get(...normalizeParameters(parameters)) ?? null;
    },

    async runAsync(sql, ...parameters) {
      const result = connection.prepare(sql).run(...normalizeParameters(parameters));

      return {
        changes: Number(result.changes),
        lastInsertRowId: Number(result.lastInsertRowid),
      };
    },

    async withTransactionAsync(work) {
      connection.exec('BEGIN;');

      try {
        const result = await work();
        connection.exec('COMMIT;');
        return result;
      } catch (error) {
        connection.exec('ROLLBACK;');
        throw error;
      }
    },

    async withExclusiveTransactionAsync(work) {
      connection.exec('BEGIN EXCLUSIVE;');

      try {
        const result = await work(this);
        connection.exec('COMMIT;');
        return result;
      } catch (error) {
        connection.exec('ROLLBACK;');
        throw error;
      }
    },

    async closeAsync() {
      connection.close();
    },
  };
}
