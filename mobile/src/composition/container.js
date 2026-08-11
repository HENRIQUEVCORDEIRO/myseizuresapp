import { SignIn } from '../application/use-cases/SignIn.js';
import { RestClient } from '../infrastructure/api/RestClient.js';
import { databaseProvider } from '../infrastructure/persistence/sqlite/DatabaseProvider.js';
import { SessionStore } from '../infrastructure/security/SessionStore.js';
import { getMobileConfig } from './config.js';

function requireDatabase(database) {
  if (typeof database?.initialize !== 'function') {
    throw new TypeError('Database provider must implement initialize().');
  }

  return database;
}

export function createContainer({
  environment,
  fetchImpl,
  secureStore,
  database = databaseProvider,
  authentication,
  sessionStore,
} = {}) {
  const config = getMobileConfig(environment);
  const authenticationAdapter =
    authentication ?? new RestClient({ baseUrl: config.apiBaseUrl, fetchImpl });
  const sessionStoreAdapter = sessionStore ?? new SessionStore({ secureStore });

  return Object.freeze({
    authentication: authenticationAdapter,
    config,
    database: requireDatabase(database),
    sessionStore: sessionStoreAdapter,
    signIn: new SignIn({
      authentication: authenticationAdapter,
      sessionStore: sessionStoreAdapter,
    }),
  });
}

let applicationContainer;

export function getContainer() {
  if (!applicationContainer) {
    applicationContainer = createContainer();
  }

  return applicationContainer;
}
