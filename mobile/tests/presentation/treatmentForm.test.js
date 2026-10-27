import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { TreatmentForm } from '../../app/(patient)/treatments/new.js';

jest.mock('@react-native-community/datetimepicker', () => {
  const ReactModule = require('react');
  const { View } = require('react-native');

  return ({ onChange, testID }) => ReactModule.createElement(View, { onChange, testID });
});

describe('treatment schedule entry', () => {
  test('adds and removes native time values without free-text ISO entry', async () => {
    const manageTreatment = {
      execute: jest.fn().mockResolvedValue({ delivery: { inApp: [{ id: 1 }] } }),
    };

    render(<TreatmentForm manageTreatment={manageTreatment} />);

    expect(screen.getByText('Nenhum horário informado.')).toBeOnTheScreen();
    expect(screen.queryByDisplayValue(/^\d{2}:\d{2}$/)).not.toBeOnTheScreen();

    fireEvent.press(screen.getByRole('button', { name: 'Adicionar horário' }));
    fireEvent(
      screen.getByTestId('treatment-time-picker'),
      'onChange',
      { type: 'set' },
      new Date(2026, 9, 25, 20, 0, 0, 0),
    );

    fireEvent.press(screen.getByRole('button', { name: 'Adicionar horário' }));
    fireEvent(
      screen.getByTestId('treatment-time-picker'),
      'onChange',
      { type: 'set' },
      new Date(2026, 9, 25, 8, 0, 0, 0),
    );

    expect(screen.getByText('08:00')).toBeOnTheScreen();
    expect(screen.getByText('20:00')).toBeOnTheScreen();

    fireEvent.changeText(screen.getByLabelText('Nome do tratamento'), 'Levetiracetam');
    fireEvent.press(screen.getByRole('button', { name: 'Salvar tratamento' }));

    await waitFor(() =>
      expect(manageTreatment.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          active: true,
          baseTimes: ['08:00', '20:00'],
          dailyFrequency: 2,
          name: 'Levetiracetam',
          type: 'MEDICATION',
        }),
      ),
    );
    expect(
      await screen.findByText('Tratamento salvo. Os lembretes estão disponíveis no aplicativo.'),
    ).toBeOnTheScreen();
  });

  test('requires at least one time and allows an existing time to be removed', async () => {
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

    fireEvent.press(screen.getByRole('button', { name: 'Remover horário 08:00' }));
    fireEvent.press(screen.getByRole('button', { name: 'Salvar tratamento' }));

    expect(await screen.findByText('Informe pelo menos um horário diário.')).toBeOnTheScreen();
    expect(manageTreatment.execute).not.toHaveBeenCalled();
  });
});
