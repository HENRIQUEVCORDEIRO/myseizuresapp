import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import SharingScreen from '../../app/(patient)/(tabs)/sharing.js';
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
    expect(await screen.findByText('Nenhum acesso ativo')).toBeOnTheScreen();

    fireEvent.changeText(screen.getByLabelText('Identificador do profissional'), '9');
    fireEvent.press(screen.getByRole('button', { name: 'Conceder acesso ao profissional' }));
    expect(await screen.findByText('Acesso concedido.')).toBeOnTheScreen();
    expect(screen.getByLabelText('Profissional 9 tem acesso ativo')).toBeOnTheScreen();

    fireEvent.press(screen.getByRole('button', { name: 'Revogar acesso do profissional 9' }));
    expect(await screen.findByText('Acesso revogado.')).toBeOnTheScreen();
    expect(screen.queryByLabelText('Profissional 9 tem acesso ativo')).not.toBeOnTheScreen();
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

    fireEvent.changeText(screen.getByLabelText('Identificador do paciente'), '1');
    fireEvent.press(screen.getByRole('button', { name: 'Verificar acesso do paciente' }));
    expect(await screen.findByText('Acesso negado')).toBeOnTheScreen();
    expect(screen.queryByText('Abrir relatório')).not.toBeOnTheScreen();

    fireEvent.press(screen.getByRole('button', { name: 'Verificar acesso do paciente' }));
    await waitFor(() => expect(screen.getByText('Acesso ativo confirmado')).toBeOnTheScreen());
    expect(screen.getByLabelText('Abrir relatório do paciente 1')).toBeOnTheScreen();
  });
});
