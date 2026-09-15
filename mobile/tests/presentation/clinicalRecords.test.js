import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import SeizureEntryScreen from '../../app/(patient)/seizures/new.js';
import TriggerEntryScreen from '../../app/(patient)/triggers/new.js';

jest.mock('@react-native-community/datetimepicker', () => {
  const ReactModule = require('react');
  const { View } = require('react-native');

  return ({ onChange, testID }) => ReactModule.createElement(View, { onChange, testID });
});

const PATIENT_ID = 7;

function createCommand(result) {
  return {
    execute: jest.fn().mockResolvedValue(result),
  };
}

describe('patient clinical-record entry flows', () => {
  test('seizure entry reports required fields and confirms a successful save', async () => {
    const recordSeizure = createCommand({ id: 101 });
    render(<SeizureEntryScreen patientId={PATIENT_ID} recordSeizure={recordSeizure} />);

    fireEvent.press(screen.getByRole('button', { name: 'Save seizure' }));

    expect(await screen.findByText('Date and time is required.')).toBeOnTheScreen();
    expect(screen.getByText('Occurrence type is required.')).toBeOnTheScreen();
    expect(recordSeizure.execute).not.toHaveBeenCalled();

    fireEvent.press(screen.getByRole('button', { name: 'Select seizure date and time date' }));
    fireEvent(
      screen.getByTestId('seizure-date-and-time-picker'),
      'onChange',
      { type: 'set' },
      new Date('2026-07-10T08:30:00.000Z'),
    );
    fireEvent(screen.getByLabelText('Occurrence type'), 'valueChange', 'FOCAL');
    fireEvent.press(screen.getByRole('button', { name: 'Save seizure' }));

    await waitFor(() =>
      expect(recordSeizure.execute).toHaveBeenCalledWith({
        patientId: PATIENT_ID,
        occurredAt: '2026-07-10T08:30:00.000Z',
        occurrenceType: 'FOCAL',
      }),
    );
    expect(await screen.findByText('Seizure saved.')).toHaveProp('accessibilityRole', 'alert');
  });

  test('trigger entry reports required fields and confirms a successful save', async () => {
    const recordTrigger = createCommand({ id: 202 });
    render(<TriggerEntryScreen patientId={PATIENT_ID} recordTrigger={recordTrigger} />);

    fireEvent.press(screen.getByRole('button', { name: 'Save trigger' }));

    expect(await screen.findByText('Date and time is required.')).toBeOnTheScreen();
    expect(screen.getByText('Cause is required.')).toBeOnTheScreen();
    expect(screen.getByText('Sleep quality is required.')).toBeOnTheScreen();
    expect(screen.getByText('Mood is required.')).toBeOnTheScreen();
    expect(recordTrigger.execute).not.toHaveBeenCalled();

    fireEvent.press(screen.getByRole('button', { name: 'Select trigger date and time date' }));
    fireEvent(
      screen.getByTestId('trigger-date-and-time-picker'),
      'onChange',
      { type: 'set' },
      new Date('2026-07-10T09:00:00.000Z'),
    );
    fireEvent(screen.getByLabelText('Cause'), 'valueChange', 'SLEEP');
    fireEvent.press(screen.getByRole('radio', { name: 'Sleep quality 2' }));
    fireEvent.press(screen.getByRole('radio', { name: 'Mood 3' }));
    fireEvent.press(screen.getByRole('button', { name: 'Save trigger' }));

    await waitFor(() =>
      expect(recordTrigger.execute).toHaveBeenCalledWith({
        patientId: PATIENT_ID,
        recordedAt: '2026-07-10T09:00:00.000Z',
        commonCause: 'SLEEP',
        sleepQuality: 2,
        mood: 3,
      }),
    );
    expect(await screen.findByText('Trigger saved.')).toHaveProp('accessibilityRole', 'alert');
  });

  test('requires a description before an other trigger can be saved', () => {
    const recordTrigger = createCommand({ id: 203 });
    render(<TriggerEntryScreen patientId={PATIENT_ID} recordTrigger={recordTrigger} />);

    fireEvent(screen.getByLabelText('Cause'), 'valueChange', 'OTHER');

    expect(screen.getByText('Describe the other cause.')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Save trigger' })).toBeDisabled();
    fireEvent.changeText(screen.getByLabelText('Other cause description'), 'Missed medication');
    expect(screen.getByRole('button', { name: 'Save trigger' })).not.toBeDisabled();
  });
});
