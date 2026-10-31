import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { TreatmentForm } from '../../app/(patient)/treatments/new.js';
import { dateToCalendarDate } from '../../src/presentation/formatters/index.js';

jest.mock('@react-native-community/datetimepicker', () => {
  const ReactModule = require('react');
  const { View } = require('react-native');

  return ({ onChange, testID }) => ReactModule.createElement(View, { onChange, testID });
});

function nextStep() {
  fireEvent.press(screen.getByRole('button', { name: 'Próximo' }));
}

describe('treatment wizard', () => {
  test('walks through the three steps and saves the complete treatment', async () => {
    const manageTreatment = {
      execute: jest.fn().mockResolvedValue({ delivery: { inApp: [{ id: 1 }] } }),
    };

    render(<TreatmentForm manageTreatment={manageTreatment} />);

    expect(screen.getByText('Etapa 1 de 3 — Info')).toBeOnTheScreen();
    fireEvent.changeText(screen.getByLabelText('Nome do tratamento'), 'Levetiracetam');
    fireEvent.changeText(screen.getByLabelText('Motivo do tratamento (opcional)'), 'Epilepsia');
    fireEvent.press(screen.getByRole('radio', { name: 'Terapia' }));
    nextStep();

    expect(screen.getByText('Etapa 2 de 3 — Frequência')).toBeOnTheScreen();
    expect(screen.getByText('Nenhum horário informado.')).toBeOnTheScreen();
    fireEvent.press(screen.getByRole('radio', { name: '2× ao dia' }));
    expect(screen.getByText('08:00')).toBeOnTheScreen();
    expect(screen.getByText('20:00')).toBeOnTheScreen();
    nextStep();

    expect(screen.getByText('Etapa 3 de 3 — Período')).toBeOnTheScreen();
    expect(screen.getByText('2× ao dia · 08:00 · 20:00')).toBeOnTheScreen();
    fireEvent.press(screen.getByRole('button', { name: 'Salvar tratamento' }));

    await waitFor(() =>
      expect(manageTreatment.execute).toHaveBeenCalledWith({
        active: true,
        baseTimes: ['08:00', '20:00'],
        dailyFrequency: 2,
        doseAmount: null,
        endDate: null,
        id: undefined,
        name: 'Levetiracetam',
        reason: 'Epilepsia',
        startDate: dateToCalendarDate(new Date()),
        type: 'THERAPY',
      }),
    );
    expect(
      await screen.findByText('Tratamento salvo. Os lembretes estão disponíveis no aplicativo.'),
    ).toBeOnTheScreen();
  });

  test('uses time shortcuts and requires at least one daily time', async () => {
    const manageTreatment = { execute: jest.fn() };

    render(
      <TreatmentForm
        initialTreatment={{
          active: true,
          baseTimes: ['08:00'],
          id: 5,
          name: 'Levetiracetam',
          type: 'MEDICATION',
        }}
        manageTreatment={manageTreatment}
      />,
    );

    nextStep();
    fireEvent.press(screen.getByRole('button', { name: 'Remover horário 08:00' }));
    nextStep();

    expect(await screen.findByText('Informe pelo menos um horário diário.')).toBeOnTheScreen();
    expect(manageTreatment.execute).not.toHaveBeenCalled();

    fireEvent.press(screen.getByRole('button', { name: 'Manhã 08:00' }));
    fireEvent.press(screen.getByRole('button', { name: 'Noite 20:00' }));

    expect(screen.getByText('08:00')).toBeOnTheScreen();
    expect(screen.getByText('20:00')).toBeOnTheScreen();
    expect(screen.getByRole('radio', { name: '2× ao dia' }).props.accessibilityState).toEqual({
      checked: true,
    });
    nextStep();

    expect(screen.getByText('Etapa 3 de 3 — Período')).toBeOnTheScreen();
  });

  test('validates a custom end date before saving', async () => {
    const manageTreatment = { execute: jest.fn() };

    render(
      <TreatmentForm
        initialTreatment={{
          active: true,
          baseTimes: ['08:00'],
          dailyFrequency: 1,
          endDate: '2026-08-20',
          id: 5,
          name: 'Levetiracetam',
          startDate: '2026-08-10',
          type: 'MEDICATION',
        }}
        manageTreatment={manageTreatment}
      />,
    );

    nextStep();
    nextStep();

    fireEvent.press(screen.getByRole('button', { name: 'Escolher data — Data de término' }));
    fireEvent(
      screen.getByTestId('treatment-end-date-picker'),
      'onChange',
      { type: 'set' },
      new Date(2026, 7, 1, 12, 0, 0, 0),
    );
    fireEvent.press(screen.getByRole('button', { name: 'Salvar tratamento' }));

    expect(
      await screen.findByText('A data de término não pode ser anterior à data de início.'),
    ).toBeOnTheScreen();
    expect(manageTreatment.execute).not.toHaveBeenCalled();
  });
});
