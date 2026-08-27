import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import SharingScreen from '../../app/(patient)/sharing.js';
import ProfessionalPatientsScreen from '../../app/(professional)/patients/index.js';

function result(value) {
  return Promise.resolve({ ok: true, value });
}

describe('sharing management and professional patient access', () => {
  test('patient creates and revokes an active grant', async () => {
    const grant = {
      id: 4,
      patientId: 1,
      medicCaretakerId: 9,
      grantedAt: '2026-08-26T12:00:00.000Z',
      revokedAt: null,
    };
    const commands = {
      listAccessGrants: { execute: jest.fn(() => result([])) },
      grantAccess: { execute: jest.fn(() => result(grant)) },
      revokeAccess: {
        execute: jest.fn(() => result({ ...grant, revokedAt: '2026-08-26T13:00:00.000Z' })),
      },
    };

    render(<SharingScreen {...commands} />);
    expect(await screen.findByText('No active access')).toBeOnTheScreen();

    fireEvent.changeText(screen.getByLabelText('Professional identifier'), '9');
    fireEvent.press(screen.getByRole('button', { name: 'Grant professional access' }));
    expect(await screen.findByText('Access granted.')).toBeOnTheScreen();
    expect(screen.getByLabelText('Professional 9 has active access')).toBeOnTheScreen();

    fireEvent.press(screen.getByRole('button', { name: 'Revoke access for professional 9' }));
    expect(await screen.findByText('Access revoked.')).toBeOnTheScreen();
    expect(screen.queryByLabelText('Professional 9 has active access')).not.toBeOnTheScreen();
    expect(commands.grantAccess.execute).toHaveBeenCalledWith({ medicCaretakerId: 9 });
    expect(commands.revokeAccess.execute).toHaveBeenCalledWith({ grantId: 4 });
  });

  test('professional sees a report link only while access is active', async () => {
    const authorizePatientAccess = {
      execute: jest
        .fn()
        .mockResolvedValueOnce({ ok: true, value: { allowed: false } })
        .mockResolvedValueOnce({ ok: true, value: { allowed: true } }),
    };
    render(<ProfessionalPatientsScreen authorizePatientAccess={authorizePatientAccess} />);

    fireEvent.changeText(screen.getByLabelText('Patient identifier'), '1');
    fireEvent.press(screen.getByRole('button', { name: 'Check patient access' }));
    expect(await screen.findByText('Access denied')).toBeOnTheScreen();
    expect(screen.queryByText('Open report')).not.toBeOnTheScreen();

    fireEvent.press(screen.getByRole('button', { name: 'Check patient access' }));
    await waitFor(() => expect(screen.getByText('Active access confirmed')).toBeOnTheScreen());
    expect(screen.getByLabelText('Open report for patient 1')).toBeOnTheScreen();
  });
});
