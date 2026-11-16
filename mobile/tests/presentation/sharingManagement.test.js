import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import SharingScreen from '../../app/(patient)/(tabs)/sharing.js';
import { ProfessionalPatientList } from '../../src/presentation/features/professional/index.js';

function result(value) {
  return Promise.resolve({ ok: true, value });
}

function createSupportContactStore(initial = null) {
  let current = initial;

  return {
    load: jest.fn(async () => current),
    save: jest.fn(async ({ name, relationship, phone }) => {
      current = { name, relationship, phone };
      return current;
    }),
    clear: jest.fn(async () => {
      current = null;
      return true;
    }),
  };
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

  test('patient saves, edits, and removes a local trusted contact', async () => {
    const manageSupportContact = createSupportContactStore();
    const commands = {
      listAccessGrants: { execute: jest.fn(() => result([])) },
      grantAccess: { execute: jest.fn() },
      revokeAccess: { execute: jest.fn() },
      manageSupportContact,
    };

    render(<SharingScreen {...commands} />);

    expect(await screen.findByLabelText('Nome do contato')).toBeOnTheScreen();
    expect(manageSupportContact.load).toHaveBeenCalledWith({});

    fireEvent.changeText(screen.getByLabelText('Nome do contato'), 'Maria');
    fireEvent.changeText(screen.getByLabelText('Relação'), 'Mãe');
    fireEvent.changeText(screen.getByLabelText('Telefone'), '(11) 99999-0000');
    fireEvent.press(screen.getByRole('button', { name: 'Salvar contato de confiança' }));

    expect(await screen.findByText('Contato de confiança salvo.')).toBeOnTheScreen();
    expect(screen.getByText('Contato salvo: Maria')).toBeOnTheScreen();
    expect(manageSupportContact.save).toHaveBeenCalledWith({
      name: 'Maria',
      relationship: 'Mãe',
      phone: '(11) 99999-0000',
    });

    fireEvent.press(screen.getByRole('button', { name: 'Remover contato de confiança' }));

    expect(await screen.findByText('Contato de confiança removido.')).toBeOnTheScreen();
    expect(manageSupportContact.clear).toHaveBeenCalledWith({});
    expect(screen.queryByText('Contato salvo: Maria')).not.toBeOnTheScreen();
  });

  test('trusted contact remains available when the professional access list is offline', async () => {
    const manageSupportContact = createSupportContactStore({
      name: 'João',
      relationship: 'Irmão',
      phone: '11988887777',
    });
    const commands = {
      listAccessGrants: {
        execute: jest.fn().mockRejectedValue(new Error('offline')),
      },
      grantAccess: { execute: jest.fn() },
      revokeAccess: { execute: jest.fn() },
      manageSupportContact,
    };

    render(<SharingScreen {...commands} />);

    expect(await screen.findByDisplayValue('João')).toBeOnTheScreen();
    expect(screen.getByDisplayValue('Irmão')).toBeOnTheScreen();
    expect(screen.getByDisplayValue('11988887777')).toBeOnTheScreen();
    expect(screen.getByText('Compartilhamento indisponível')).toBeOnTheScreen();

    fireEvent.changeText(screen.getByLabelText('Telefone'), '11977776666');
    fireEvent.press(screen.getByRole('button', { name: 'Salvar contato de confiança' }));

    expect(await screen.findByText('Contato de confiança salvo.')).toBeOnTheScreen();
    expect(manageSupportContact.save).toHaveBeenCalledWith({
      name: 'João',
      relationship: 'Irmão',
      phone: '11977776666',
    });
  });

  test('requires a name and phone before saving the trusted contact', async () => {
    const manageSupportContact = createSupportContactStore();
    render(
      <SharingScreen
        grantAccess={{ execute: jest.fn() }}
        listAccessGrants={{ execute: jest.fn(() => result([])) }}
        manageSupportContact={manageSupportContact}
        revokeAccess={{ execute: jest.fn() }}
      />,
    );

    fireEvent.press(await screen.findByRole('button', { name: 'Salvar contato de confiança' }));

    expect(screen.getByText('Informe o nome do contato.')).toBeOnTheScreen();
    expect(screen.getByText('Informe o telefone do contato.')).toBeOnTheScreen();
    expect(manageSupportContact.save).not.toHaveBeenCalled();
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
