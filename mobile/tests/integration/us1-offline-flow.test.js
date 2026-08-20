import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { isAbsolute, join, relative, resolve } from 'node:path';

import { cleanup, fireEvent, render, waitFor } from '@testing-library/react-native';

import CalendarScreen from '../../app/(patient)/calendar.js';
import SeizureEntryScreen from '../../app/(patient)/seizures/new.js';
import TriggerEntryScreen from '../../app/(patient)/triggers/new.js';
import {
  ListChronologicalEvents,
  RecordSeizure,
  RecordTrigger,
} from '../../src/application/use-cases/clinical/index.js';
import { SeizureOccurrenceType, TriggerCause } from '../../src/domain/value-objects/index.js';
import {
  SeizureRepository,
  TriggerRepository,
} from '../../src/infrastructure/persistence/repositories/index.js';
import { DatabaseProvider } from '../../src/infrastructure/persistence/sqlite/DatabaseProvider.js';
import { createSQLiteTestDatabase } from '../unit/factories/sqliteTestDatabase.js';

const PATIENT_ID = 1;
const NOW = '2026-08-11T15:00:00.000Z';
const TRIGGER_TIME = '2026-08-10T08:00:00.000Z';
const SEIZURE_TIME = '2026-08-10T09:30:00.000Z';
const PERIOD = Object.freeze({
  periodStart: '2026-08-10T00:00:00.000Z',
  periodEnd: '2026-08-10T23:59:59.999Z',
});

async function createProvider(databasePath) {
  const database = createSQLiteTestDatabase(databasePath);
  const provider = new DatabaseProvider({
    databaseName: databasePath,
    openDatabase: jest.fn().mockResolvedValue(database),
  });

  await provider.initialize();
  return { database, provider };
}

async function seedActivePatient(database) {
  await database.runAsync(
    `INSERT INTO users (id, name, email, password_hash, role, created_at)
     VALUES (?, ?, ?, ?, 'PATIENT', ?);`,
    PATIENT_ID,
    'Offline Patient',
    'offline.patient@example.test',
    'offline-test-hash',
    NOW,
  );
  await database.runAsync(
    `INSERT INTO patients (id, user_id, birth_date, diagnosis_date)
     VALUES (?, ?, ?, ?);`,
    PATIENT_ID,
    PATIENT_ID,
    '1980-01-01',
    null,
  );
}

function createClinicalUseCases(provider) {
  const seizureRepository = new SeizureRepository({ databaseProvider: provider });
  const triggerRepository = new TriggerRepository({ databaseProvider: provider });
  const getActivePatientId = () => PATIENT_ID;

  return {
    listChronologicalEvents: new ListChronologicalEvents({
      seizureRepository,
      triggerRepository,
      getActivePatientId,
    }),
    recordSeizure: new RecordSeizure({
      seizureRepository,
      getActivePatientId,
      now: () => NOW,
    }),
    recordTrigger: new RecordTrigger({
      triggerRepository,
      getActivePatientId,
      now: () => NOW,
    }),
  };
}

function removeVerifiedTemporaryDirectory(directory) {
  const temporaryRoot = resolve(tmpdir());
  const target = resolve(directory);
  const pathFromTemporaryRoot = relative(temporaryRoot, target);

  if (
    !pathFromTemporaryRoot ||
    pathFromTemporaryRoot.startsWith('..') ||
    isAbsolute(pathFromTemporaryRoot)
  ) {
    throw new Error('Refusing to remove a directory outside the operating-system temp folder.');
  }

  rmSync(target, { force: true, recursive: true });
}

function OfflineJourneyStage({ listChronologicalEvents, recordSeizure, recordTrigger, stage }) {
  if (stage === 'seizure') {
    return <SeizureEntryScreen patientId={PATIENT_ID} recordSeizure={recordSeizure} />;
  }

  if (stage === 'trigger') {
    return <TriggerEntryScreen patientId={PATIENT_ID} recordTrigger={recordTrigger} />;
  }

  return (
    <CalendarScreen
      initialPeriod={PERIOD}
      listChronologicalEvents={listChronologicalEvents}
      patientId={PATIENT_ID}
    />
  );
}

describe('US1 offline clinical-record journey', () => {
  let database;
  let originalFetch;
  let temporaryDirectory;

  beforeEach(() => {
    temporaryDirectory = mkdtempSync(join(tmpdir(), 'myseizures-us1-offline-'));
    originalFetch = global.fetch;
    global.fetch = jest.fn().mockRejectedValue(new Error('Network access is disabled.'));
  });

  afterEach(async () => {
    cleanup();
    await database?.closeAsync();
    global.fetch = originalFetch;
    removeVerifiedTemporaryDirectory(temporaryDirectory);
  });

  test('records a seizure and trigger offline, restarts, and shows both in calendar order', async () => {
    const databasePath = join(temporaryDirectory, 'offline-care.db');
    const firstLaunch = await createProvider(databasePath);
    database = firstLaunch.database;
    await seedActivePatient(database);
    const firstLaunchUseCases = createClinicalUseCases(firstLaunch.provider);

    const journey = render(
      <OfflineJourneyStage recordSeizure={firstLaunchUseCases.recordSeizure} stage="seizure" />,
    );
    fireEvent.changeText(journey.getByLabelText('Seizure date and time'), SEIZURE_TIME);
    fireEvent(
      journey.getByLabelText('Occurrence type'),
      'valueChange',
      SeizureOccurrenceType.FOCAL,
    );
    fireEvent.press(journey.getByRole('button', { name: 'Save seizure' }));
    expect(await journey.findByText('Seizure saved.')).toBeOnTheScreen();

    journey.rerender(
      <OfflineJourneyStage recordTrigger={firstLaunchUseCases.recordTrigger} stage="trigger" />,
    );
    fireEvent.changeText(journey.getByLabelText('Trigger date and time'), TRIGGER_TIME);
    fireEvent(journey.getByLabelText('Cause'), 'valueChange', TriggerCause.SLEEP);
    fireEvent(journey.getByLabelText('Sleep quality'), 'valueChange', 2);
    fireEvent(journey.getByLabelText('Mood'), 'valueChange', 3);
    fireEvent.press(journey.getByRole('button', { name: 'Save trigger' }));
    expect(await journey.findByText('Trigger saved.')).toBeOnTheScreen();

    await database.closeAsync();
    database = null;

    const restartedApp = await createProvider(databasePath);
    database = restartedApp.database;
    const restartedUseCases = createClinicalUseCases(restartedApp.provider);

    journey.rerender(
      <OfflineJourneyStage
        listChronologicalEvents={restartedUseCases.listChronologicalEvents}
        stage="calendar"
      />,
    );

    const events = await journey.findAllByRole('listitem');
    expect(events.map((event) => event.props.accessibilityLabel)).toEqual([
      `Possible trigger at ${TRIGGER_TIME}`,
      `Seizure at ${SEIZURE_TIME}`,
    ]);
    await waitFor(() => expect(global.fetch).not.toHaveBeenCalled());
  });
});
