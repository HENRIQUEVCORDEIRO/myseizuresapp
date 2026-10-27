import { render, screen } from '@testing-library/react-native';

import { ReminderList } from '../../app/(patient)/reminders.js';
import { formatDateTime, formatDateTimeLong } from '../../src/presentation/formatters/index.js';

const SCHEDULED_AT = '2026-10-25T12:00:00.000Z';

describe('medication dose list', () => {
  test('mounts with the async loader and shows local date and time', async () => {
    const listReminders = {
      execute: jest.fn().mockResolvedValue([{ id: 1, scheduledAt: SCHEDULED_AT }]),
    };

    render(
      <ReminderList
        confirmDose={{ execute: jest.fn() }}
        listReminders={listReminders}
        selectedReminderId="1"
      />,
    );

    expect(await screen.findByText('Doses de medicação')).toBeOnTheScreen();
    expect(await screen.findByText(formatDateTime(SCHEDULED_AT))).toBeOnTheScreen();
    expect(
      screen.getByLabelText(`Lembrete 1 em ${formatDateTimeLong(SCHEDULED_AT)}`),
    ).toBeOnTheScreen();
  });

  test('exposes a retry action when medication doses cannot be loaded', async () => {
    const listReminders = {
      execute: jest.fn().mockRejectedValue(new Error('local failure')),
    };

    render(<ReminderList confirmDose={{ execute: jest.fn() }} listReminders={listReminders} />);

    expect(
      await screen.findByText('Não foi possível carregar as doses de medicação.'),
    ).toBeOnTheScreen();
    expect(
      screen.getByRole('button', { name: 'Tentar carregar as doses de medicação novamente' }),
    ).toBeOnTheScreen();
  });
});
