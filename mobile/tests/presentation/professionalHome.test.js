import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { ProfessionalPatientList } from '../../src/presentation/features/professional/index.js';

const GRANT = Object.freeze({
  id: 4,
  patientId: 1,
  medicCaretakerId: 1,
  grantedAt: '2026-08-26T12:00:00.000Z',
  revokedAt: null,
});

function renderList(overrides = {}) {
  const listAuthorizedPatients = {
    execute: jest.fn().mockResolvedValue({ ok: true, value: [GRANT] }),
  };
  const onOpenPatient = jest.fn();
  const onSignOut = jest.fn();

  render(
    <ProfessionalPatientList
      listAuthorizedPatients={listAuthorizedPatients}
      onOpenPatient={onOpenPatient}
      onSignOut={onSignOut}
      {...overrides}
    />,
  );

  return { listAuthorizedPatients, onOpenPatient, onSignOut };
}

describe('professional authorized-patient home', () => {
  test('lists active patients and opens the selected report', async () => {
    const { onOpenPatient } = renderList();

    expect(await screen.findByText('Paciente 1')).toBeOnTheScreen();
    expect(screen.getByText('Acesso ativo')).toBeOnTheScreen();
    expect(screen.getByLabelText('Abrir relatório do paciente 1')).toBeOnTheScreen();

    fireEvent.press(screen.getByLabelText('Abrir relatório do paciente 1'));
    expect(onOpenPatient).toHaveBeenCalledWith(1);
  });

  test('explains the empty state when nobody shared data', async () => {
    renderList({
      listAuthorizedPatients: {
        execute: jest.fn().mockResolvedValue({ ok: true, value: [] }),
      },
    });

    expect(await screen.findByText('Nenhum paciente compartilhou dados')).toBeOnTheScreen();
    expect(
      screen.getByText('Peça ao paciente para conceder acesso em Compartilhamento.'),
    ).toBeOnTheScreen();
  });

  test('retries after a loading failure', async () => {
    const execute = jest
      .fn()
      .mockResolvedValueOnce({ ok: false, error: { code: 'NETWORK_ERROR' } })
      .mockResolvedValueOnce({ ok: true, value: [GRANT] });
    renderList({ listAuthorizedPatients: { execute } });

    expect(await screen.findByText('Pacientes indisponíveis')).toBeOnTheScreen();
    fireEvent.press(screen.getByRole('button', { name: 'Tentar novamente' }));

    await waitFor(() => expect(screen.getByText('Paciente 1')).toBeOnTheScreen());
    expect(execute).toHaveBeenCalledTimes(2);
  });

  test('refreshes the list after access is revoked', async () => {
    const execute = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, value: [GRANT] })
      .mockResolvedValueOnce({ ok: true, value: [] });
    renderList({ listAuthorizedPatients: { execute } });

    expect(await screen.findByText('Paciente 1')).toBeOnTheScreen();
    fireEvent.press(screen.getByRole('button', { name: 'Atualizar' }));

    await waitFor(() =>
      expect(screen.getByText('Nenhum paciente compartilhou dados')).toBeOnTheScreen(),
    );
    expect(execute).toHaveBeenCalledTimes(2);
  });
});
