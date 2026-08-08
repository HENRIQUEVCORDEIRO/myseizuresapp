import { databaseProvider as defaultDatabaseProvider } from '../sqlite/DatabaseProvider.js';

function requireSql(sql) {
  if (typeof sql !== 'string' || !sql.trim()) {
    throw new TypeError('Repository SQL must be a non-empty string.');
  }

  return sql;
}

function requireBindParameters(parameters) {
  const isObject =
    parameters !== null &&
    typeof parameters === 'object' &&
    (Object.getPrototypeOf(parameters) === Object.prototype ||
      Object.getPrototypeOf(parameters) === null);

  if (!Array.isArray(parameters) && !isObject) {
    throw new TypeError('Repository parameters must be an array or a plain object.');
  }

  return parameters;
}

function requireDatabaseProvider(databaseProvider) {
  for (const method of ['getDatabase', 'withTransaction']) {
    if (typeof databaseProvider?.[method] !== 'function') {
      throw new TypeError(`Database provider must implement ${method}().`);
    }
  }

  return databaseProvider;
}

export class SQLiteRepository {
  constructor({ databaseProvider = defaultDatabaseProvider } = {}) {
    this.databaseProvider = requireDatabaseProvider(databaseProvider);
  }

  run(sql, parameters = []) {
    return this.execute('runAsync', sql, parameters);
  }

  getFirst(sql, parameters = []) {
    return this.execute('getFirstAsync', sql, parameters);
  }

  getAll(sql, parameters = []) {
    return this.execute('getAllAsync', sql, parameters);
  }

  withTransaction(work) {
    if (typeof work !== 'function') {
      throw new TypeError('Repository transaction work must be a function.');
    }

    return this.databaseProvider.withTransaction(work);
  }

  async execute(method, sql, parameters) {
    const safeSql = requireSql(sql);
    const safeParameters = requireBindParameters(parameters);
    const database = await this.databaseProvider.getDatabase();

    if (typeof database?.[method] !== 'function') {
      throw new TypeError(`SQLite database must implement ${method}().`);
    }

    return database[method](safeSql, safeParameters);
  }
}
