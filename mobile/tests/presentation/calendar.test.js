import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import CalendarScreen from '../../app/(patient)/(tabs)/calendar.js';
import { formatDateTimeLong } from '../../src/presentation/formatters/index.js';

jest.mock('@react-native-community/datetimepicker', () => {
  const ReactModule = require('react');
  const { View } = require('react-native');

  return ({ onChange, testID }) => ReactModule.createElement(View, { onChange, testID });
});

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
      feltAura: true,
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
    const items = await screen.findAllByLabelText(/^(Possível gatilho|Crise) em /);

    expect(items.map((item) => item.props.accessibilityLabel)).toEqual([
      `Possível gatilho em ${formatDateTimeLong(trigger.recordedAt)}`,
      `Crise em ${formatDateTimeLong(seizure.occurredAt)}`,
    ]);
    expect(screen.getByText('Possível gatilho')).toBeOnTheScreen();
    expect(screen.getByText('Causa: Sono')).toBeOnTheScreen();
    expect(screen.getByText('Crise')).toBeOnTheScreen();
    expect(screen.getByText('Tipo de ocorrência: Focal')).toBeOnTheScreen();
    expect(screen.getByText('Sentiu que viria: Sim')).toBeOnTheScreen();
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

    fireEvent.press(screen.getByRole('button', { name: 'Ver histórico' }));

    expect(await screen.findByText('A data e hora inicial são obrigatórias.')).toBeOnTheScreen();
    expect(screen.getByText('A data e hora final são obrigatórias.')).toBeOnTheScreen();
    expect(listChronologicalEvents.execute).not.toHaveBeenCalled();

    const start = new Date(2026, 7, 10, 0, 0, 0, 0);
    const end = new Date(2026, 7, 10, 23, 59, 0, 0);

    fireEvent.press(screen.getByRole('button', { name: 'Escolher data — Início do período' }));
    fireEvent(
      screen.getByTestId('period-start-picker'),
      'onChange',
      { type: 'set' },
      new Date(2026, 7, 10),
    );
    fireEvent.press(screen.getByRole('button', { name: 'Escolher hora — Início do período' }));
    fireEvent(screen.getByTestId('period-start-picker'), 'onChange', { type: 'set' }, start);

    fireEvent.press(screen.getByRole('button', { name: 'Escolher data — Fim do período' }));
    fireEvent(
      screen.getByTestId('period-end-picker'),
      'onChange',
      { type: 'set' },
      new Date(2026, 7, 10),
    );
    fireEvent.press(screen.getByRole('button', { name: 'Escolher hora — Fim do período' }));
    fireEvent(screen.getByTestId('period-end-picker'), 'onChange', { type: 'set' }, end);

    fireEvent.press(screen.getByRole('button', { name: 'Ver histórico' }));

    await waitFor(() =>
      expect(listChronologicalEvents.execute).toHaveBeenCalledWith({
        patientId: PATIENT_ID,
        periodStart: start.toISOString(),
        periodEnd: end.toISOString(),
      }),
    );
    expect(await screen.findByText('Nenhum evento neste período.')).toBeOnTheScreen();
  });

  test('shows an actionable error when local history cannot be loaded', async () => {
    const listChronologicalEvents = {
      execute: jest.fn().mockRejectedValue(new Error('local failure')),
    };

    render(
      <CalendarScreen
        initialPeriod={PERIOD}
        listChronologicalEvents={listChronologicalEvents}
        patientId={PATIENT_ID}
      />,
    );

    expect(await screen.findByText('Não foi possível carregar o histórico local.')).toHaveProp(
      'accessibilityRole',
      'alert',
    );
    fireEvent.press(screen.getByRole('button', { name: 'Tentar novamente' }));
    await waitFor(() => expect(listChronologicalEvents.execute).toHaveBeenCalledTimes(2));
  });
});
