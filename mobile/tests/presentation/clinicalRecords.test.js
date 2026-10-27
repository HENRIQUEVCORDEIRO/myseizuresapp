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

    fireEvent.press(screen.getByRole('button', { name: 'Salvar crise' }));

    expect(await screen.findByText('Informe a data e hora da crise.')).toBeOnTheScreen();
    expect(screen.getByText('Informe o tipo de ocorrência.')).toBeOnTheScreen();
    expect(recordSeizure.execute).not.toHaveBeenCalled();

    const occurredAt = new Date(2026, 6, 10, 8, 30, 0, 0);

    fireEvent.press(screen.getByRole('button', { name: 'Escolher data — Data e hora da crise' }));
    fireEvent(
      screen.getByTestId('seizure-date-and-time-picker'),
      'onChange',
      { type: 'set' },
      new Date(2026, 6, 10),
    );
    fireEvent.press(screen.getByRole('button', { name: 'Escolher hora — Data e hora da crise' }));
    fireEvent(
      screen.getByTestId('seizure-date-and-time-picker'),
      'onChange',
      { type: 'set' },
      occurredAt,
    );
    fireEvent(screen.getByLabelText('Tipo de ocorrência'), 'valueChange', 'FOCAL');
    fireEvent.press(screen.getByRole('button', { name: 'Salvar crise' }));

    await waitFor(() =>
      expect(recordSeizure.execute).toHaveBeenCalledWith({
        patientId: PATIENT_ID,
        occurredAt: occurredAt.toISOString(),
        occurrenceType: 'FOCAL',
      }),
    );
    expect(await screen.findByText('Crise salva.')).toHaveProp('accessibilityRole', 'alert');
  });

  test('trigger entry reports required fields and confirms a successful save', async () => {
    const recordTrigger = createCommand({ id: 202 });
    render(<TriggerEntryScreen patientId={PATIENT_ID} recordTrigger={recordTrigger} />);

    fireEvent.press(screen.getByRole('button', { name: 'Salvar gatilho' }));

    expect(await screen.findByText('Informe a data e hora do gatilho.')).toBeOnTheScreen();
    expect(screen.getByText('Informe a causa.')).toBeOnTheScreen();
    expect(screen.getByText('Informe a qualidade do sono.')).toBeOnTheScreen();
    expect(screen.getByText('Informe o humor.')).toBeOnTheScreen();
    expect(recordTrigger.execute).not.toHaveBeenCalled();

    const recordedAt = new Date(2026, 6, 10, 9, 0, 0, 0);

    fireEvent.press(screen.getByRole('button', { name: 'Escolher data — Data e hora do gatilho' }));
    fireEvent(
      screen.getByTestId('trigger-date-and-time-picker'),
      'onChange',
      { type: 'set' },
      new Date(2026, 6, 10),
    );
    fireEvent.press(screen.getByRole('button', { name: 'Escolher hora — Data e hora do gatilho' }));
    fireEvent(
      screen.getByTestId('trigger-date-and-time-picker'),
      'onChange',
      { type: 'set' },
      recordedAt,
    );
    fireEvent(screen.getByLabelText('Causa'), 'valueChange', 'SLEEP');
    fireEvent.press(screen.getByRole('radio', { name: 'Qualidade do sono 2' }));
    fireEvent.press(screen.getByRole('radio', { name: 'Humor 3' }));
    fireEvent.press(screen.getByRole('button', { name: 'Salvar gatilho' }));

    await waitFor(() =>
      expect(recordTrigger.execute).toHaveBeenCalledWith({
        patientId: PATIENT_ID,
        recordedAt: recordedAt.toISOString(),
        commonCause: 'SLEEP',
        sleepQuality: 2,
        mood: 3,
      }),
    );
    expect(await screen.findByText('Gatilho salvo.')).toHaveProp('accessibilityRole', 'alert');
  });

  test('requires a description before an other trigger can be saved', () => {
    const recordTrigger = createCommand({ id: 203 });
    render(<TriggerEntryScreen patientId={PATIENT_ID} recordTrigger={recordTrigger} />);

    fireEvent(screen.getByLabelText('Causa'), 'valueChange', 'OTHER');

    expect(screen.getByText('Descreva a outra causa.')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Salvar gatilho' })).toBeDisabled();
    fireEvent.changeText(screen.getByLabelText('Descrição da outra causa'), 'Medicação esquecida');
    expect(screen.getByRole('button', { name: 'Salvar gatilho' })).not.toBeDisabled();
  });
});
