import { SignIn } from '../application/use-cases/SignIn.js';
import {
  AuthorizePatientAccess,
  GrantAccess,
  ListAccessGrants,
  RevokeAccess,
} from '../application/use-cases/access/index.js';
import {
  ListChronologicalEvents,
  RecordSeizure,
  RecordTrigger,
} from '../application/use-cases/clinical/index.js';
import { ExportReport } from '../application/use-cases/export/index.js';
import { GenerateReport } from '../application/use-cases/reporting/index.js';
import {
  ConfirmDose,
  GetTreatment,
  ListReminders,
  ListTreatments,
  ManageTreatment,
} from '../application/use-cases/treatment/index.js';
import { RestClient } from '../infrastructure/api/RestClient.js';
import { AccessGrantClient } from '../infrastructure/api/AccessGrantClient.js';
import { ExpoNotificationService } from '../infrastructure/notifications/ExpoNotificationService.js';
import { ReportFileExporter, RndsExportMapper } from '../infrastructure/export/index.js';
import {
  PatientRepository,
  SeizureRepository,
  TreatmentRepository,
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
  notifications,
} = {}) {
  const config = getMobileConfig(environment);
  const authenticationAdapter =
    authentication ?? new RestClient({ baseUrl: config.apiBaseUrl, fetchImpl });
  const accessGrantClient = new AccessGrantClient({ baseUrl: config.apiBaseUrl, fetchImpl });
  const sessionStoreAdapter = sessionStore ?? new SessionStore({ secureStore });
  const notificationAdapter = notifications ?? new ExpoNotificationService();
  const clinicalCommands = new Map();
  const treatmentCommands = new Map();
  const accessCommands = new Map();
  const reportCommands = new Map();
  const getSessionToken = async () => (await sessionStoreAdapter.loadSession())?.token;
  const getActivePatientId = async () => {
    const user = (await sessionStoreAdapter.loadSession())?.user;
    return user?.role === 'PATIENT' ? (user.patientId ?? user.id) : null;
  };

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

  function treatmentForPatient(patientId) {
    if (!Number.isInteger(patientId) || patientId < 1)
      throw new TypeError('Treatment commands require a positive patient id.');
    if (!treatmentCommands.has(patientId)) {
      const treatmentRepository = new TreatmentRepository({ databaseProvider: database });
      const options = { treatmentRepository, getActivePatientId: () => patientId };
      treatmentCommands.set(
        patientId,
        Object.freeze({
          confirmDose: new ConfirmDose(options),
          getTreatment: new GetTreatment(options),
          listReminders: new ListReminders(options),
          listTreatments: new ListTreatments(options),
          manageTreatment: new ManageTreatment({ ...options, notifications: notificationAdapter }),
        }),
      );
    }
    return treatmentCommands.get(patientId);
  }

  function accessForPatient(patientId) {
    if (!Number.isInteger(patientId) || patientId < 1) {
      throw new TypeError('Access commands require a positive patient id.');
    }
    if (!accessCommands.has(patientId)) {
      const options = {
        accessGrantClient,
        getActivePatientId: () => patientId,
        getSessionToken,
      };
      accessCommands.set(
        patientId,
        Object.freeze({
          grantAccess: new GrantAccess(options),
          listAccessGrants: new ListAccessGrants(options),
          revokeAccess: new RevokeAccess(options),
        }),
      );
    }
    return accessCommands.get(patientId);
  }

  function reportForPatient(patientId) {
    if (!Number.isInteger(patientId) || patientId < 1) {
      throw new TypeError('Report commands require a positive patient id.');
    }
    if (!reportCommands.has(patientId)) {
      const generateReport = new GenerateReport({
        seizureRepository: new SeizureRepository({ databaseProvider: database }),
        triggerRepository: new TriggerRepository({ databaseProvider: database }),
        treatmentRepository: new TreatmentRepository({ databaseProvider: database }),
        authorizePatientAccess: new AuthorizePatientAccess({
          accessGrantClient,
          getSessionToken,
        }),
        getActivePatientId,
      });
      reportCommands.set(
        patientId,
        Object.freeze({
          exportReport: new ExportReport({
            generateReport,
            patientRepository: new PatientRepository({ databaseProvider: database }),
            exportMapper: new RndsExportMapper(),
            reportExporter: new ReportFileExporter(),
          }),
          generateReport,
        }),
      );
    }
    return reportCommands.get(patientId);
  }

  return Object.freeze({
    accessForPatient,
    authorizePatientAccess: new AuthorizePatientAccess({
      accessGrantClient,
      getSessionToken,
    }),
    authentication: authenticationAdapter,
    clinicalForPatient,
    config,
    database: requireDatabase(database),
    reportForPatient,
    sessionStore: sessionStoreAdapter,
    signIn: new SignIn({
      authentication: authenticationAdapter,
      sessionStore: sessionStoreAdapter,
    }),
    treatmentForPatient,
  });
}

let applicationContainer;

export function getContainer() {
  if (!applicationContainer) {
    applicationContainer = createContainer();
  }

  return applicationContainer;
}
