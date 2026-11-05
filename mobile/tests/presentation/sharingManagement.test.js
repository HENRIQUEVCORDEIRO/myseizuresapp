import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import SharingScreen from '../../app/(patient)/(tabs)/sharing.js';
import { ProfessionalPatientList } from '../../src/presentation/features/professional/index.js';

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

  test('professional sees only currently authorized patients', async () => {
    const grant = {
      id: 4,
      patientId: 1,
      medicCaretakerId: 1,
      grantedAt: '2026-08-26T12:00:00.000Z',
      revokedAt: null,
    };
    const listAuthorizedPatients = {
      execute: jest
        .fn()
        .mockResolvedValueOnce({ ok: true, value: [grant] })
        .mockResolvedValueOnce({ ok: true, value: [] }),
    };
    const onOpenPatient = jest.fn();

    render(
      <ProfessionalPatientList
        listAuthorizedPatients={listAuthorizedPatients}
        onOpenPatient={onOpenPatient}
        onSignOut={jest.fn()}
      />,
    );

    expect(await screen.findByText('Paciente 1')).toBeOnTheScreen();
    fireEvent.press(screen.getByLabelText('Abrir relatório do paciente 1'));
    expect(onOpenPatient).toHaveBeenCalledWith(1);

    fireEvent.press(screen.getByRole('button', { name: 'Atualizar' }));
    await waitFor(() =>
      expect(screen.getByText('Nenhum paciente compartilhou dados')).toBeOnTheScreen(),
    );
  });
});
