import { SignIn } from '../application/use-cases/SignIn.js';
import {
  ListChronologicalEvents,
  RecordSeizure,
  RecordTrigger,
} from '../application/use-cases/clinical/index.js';
import { RestClient } from '../infrastructure/api/RestClient.js';
import {
  SeizureRepository,
  TriggerRepository,
} from '../infrastructure/persistence/repositories/index.js';
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
  const clinicalCommands = new Map();

  function clinicalForPatient(patientId) {
    if (!Number.isInteger(patientId) || patientId < 1) {
      throw new TypeError('Clinical commands require a positive patient id.');
    }

    if (!clinicalCommands.has(patientId)) {
      const getActivePatientId = () => patientId;
      const seizureRepository = new SeizureRepository({ databaseProvider: database });
      const triggerRepository = new TriggerRepository({ databaseProvider: database });

      clinicalCommands.set(
        patientId,
        Object.freeze({
          listChronologicalEvents: new ListChronologicalEvents({
            seizureRepository,
            triggerRepository,
            getActivePatientId,
          }),
          recordSeizure: new RecordSeizure({
            seizureRepository,
            getActivePatientId,
          }),
          recordTrigger: new RecordTrigger({
            triggerRepository,
            getActivePatientId,
          }),
        }),
      );
    }

    return clinicalCommands.get(patientId);
  }

  return Object.freeze({
    authentication: authenticationAdapter,
    clinicalForPatient,
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
