const CREATE_MIGRATIONS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY NOT NULL,
    name TEXT NOT NULL UNIQUE,
    applied_at TEXT NOT NULL
  );
`;

function validateDatabase(database) {
  const requiredMethods = ['execAsync', 'getAllAsync', 'runAsync', 'withTransactionAsync'];

  for (const method of requiredMethods) {
    if (typeof database?.[method] !== 'function') {
      throw new TypeError(`Migration database must implement ${method}().`);
    }
  }
}

function prepareMigrations(migrations) {
  if (!Array.isArray(migrations)) {
    throw new TypeError('Migrations must be provided as an array.');
  }

  const orderedMigrations = [...migrations].sort((left, right) => left.version - right.version);
  const versions = new Set();
  const names = new Set();

  for (const migration of orderedMigrations) {
    if (!Number.isInteger(migration?.version) || migration.version < 1) {
      throw new TypeError('Each migration must have a positive integer version.');
    }

    if (!migration.name?.trim() || !migration.up?.trim()) {
      throw new TypeError(`Migration ${migration.version} must have a name and SQL body.`);
    }

    if (versions.has(migration.version) || names.has(migration.name)) {
      throw new Error(
        `Duplicate migration version or name: ${migration.version} (${migration.name}).`,
      );
    }

    versions.add(migration.version);
    names.add(migration.name);
  }

  return orderedMigrations;
}

export async function runMigrations(database, migrations) {
  validateDatabase(database);
  const orderedMigrations = prepareMigrations(migrations);

  await database.execAsync('PRAGMA foreign_keys = ON;');
  await database.execAsync(CREATE_MIGRATIONS_TABLE_SQL);

  const appliedRows = await database.getAllAsync('SELECT version, name FROM schema_migrations;');
  const appliedMigrations = new Map(appliedRows.map((row) => [row.version, row.name]));

  for (const migration of orderedMigrations) {
    const appliedName = appliedMigrations.get(migration.version);

    if (appliedName === migration.name) {
      continue;
    }

    if (appliedName) {
      throw new Error(
        `Migration version ${migration.version} is already registered as ${appliedName}.`,
      );
    }

    await database.withTransactionAsync(async () => {
      await database.execAsync(migration.up);
      await database.runAsync(
        'INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?);',
        migration.version,
        migration.name,
        new Date().toISOString(),
      );
    });
  }
}
