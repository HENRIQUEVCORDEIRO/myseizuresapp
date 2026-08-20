import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import CalendarScreen from '../../app/(patient)/calendar.js';

const PATIENT_ID = 7;
const PERIOD = Object.freeze({
  periodStart: '2026-08-10T00:00:00.000Z',
  periodEnd: '2026-08-10T23:59:59.999Z',
});

function createQuery(result) {
  return { execute: jest.fn().mockResolvedValue(result) };
}

describe('patient chronological calendar', () => {
  test('loads the selected period and distinguishes events in chronological order', async () => {
    const trigger = {
      id: 12,
      patientId: PATIENT_ID,
      recordedAt: '2026-08-10T08:00:00.000Z',
      commonCause: 'SLEEP',
      sleepQuality: 2,
      mood: 3,
    };
    const seizure = {
      id: 13,
      patientId: PATIENT_ID,
      occurredAt: '2026-08-10T09:30:00.000Z',
      occurrenceType: 'FOCAL',
    };
    const listChronologicalEvents = createQuery([
      { eventType: 'TRIGGER', occurredAt: trigger.recordedAt, record: trigger },
      { eventType: 'SEIZURE', occurredAt: seizure.occurredAt, record: seizure },
    ]);

    render(
      <CalendarScreen
        initialPeriod={PERIOD}
        listChronologicalEvents={listChronologicalEvents}
        patientId={PATIENT_ID}
      />,
    );

    await waitFor(() =>
      expect(listChronologicalEvents.execute).toHaveBeenCalledWith({
        patientId: PATIENT_ID,
        ...PERIOD,
      }),
    );
    const items = await screen.findAllByRole('listitem');

    expect(items.map((item) => item.props.accessibilityLabel)).toEqual([
      `Possible trigger at ${trigger.recordedAt}`,
      `Seizure at ${seizure.occurredAt}`,
    ]);
    expect(screen.getByText('Possible trigger')).toBeOnTheScreen();
    expect(screen.getByText('Cause: Sleep')).toBeOnTheScreen();
    expect(screen.getByText('Seizure')).toBeOnTheScreen();
    expect(screen.getByText('Occurrence type: Focal')).toBeOnTheScreen();
  });

  test('validates a manually selected period before loading history', async () => {
    const listChronologicalEvents = createQuery([]);

    render(
      <CalendarScreen
        loadOnMount={false}
        listChronologicalEvents={listChronologicalEvents}
        patientId={PATIENT_ID}
      />,
    );

    fireEvent.press(screen.getByRole('button', { name: 'View history' }));

    expect(await screen.findByText('Start date and time is required.')).toBeOnTheScreen();
    expect(screen.getByText('End date and time is required.')).toBeOnTheScreen();
    expect(listChronologicalEvents.execute).not.toHaveBeenCalled();

    fireEvent.changeText(screen.getByLabelText('Period start'), PERIOD.periodStart);
    fireEvent.changeText(screen.getByLabelText('Period end'), PERIOD.periodEnd);
    fireEvent.press(screen.getByRole('button', { name: 'View history' }));

    await waitFor(() =>
      expect(listChronologicalEvents.execute).toHaveBeenCalledWith({
        patientId: PATIENT_ID,
        ...PERIOD,
      }),
    );
    expect(await screen.findByText('No events in this period.')).toBeOnTheScreen();
  });

  test('shows an actionable error when local history cannot be loaded', async () => {
    const listChronologicalEvents = {
      execute: jest.fn().mockRejectedValue(new Error('Local history is unavailable.')),
    };

    render(
      <CalendarScreen
        initialPeriod={PERIOD}
        listChronologicalEvents={listChronologicalEvents}
        patientId={PATIENT_ID}
      />,
    );

    expect(await screen.findByText('Local history is unavailable.')).toHaveProp(
      'accessibilityRole',
      'alert',
    );
    fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(listChronologicalEvents.execute).toHaveBeenCalledTimes(2));
  });
});
