import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import ProfessionalReportScreen from '../../app/(professional)/reports/[patientId].js';
import { ReportAccessDeniedError } from '../../src/application/use-cases/reporting/index.js';

const PERIOD_END = '2026-08-26T23:59:59.999Z';

function report(overrides = {}) {
  return {
    patientId: 1,
    period: { periodStart: '2026-08-20T00:00:00.000Z', periodEnd: PERIOD_END },
    seizures: [{ id: 1 }, { id: 2 }, { id: 3 }],
    triggers: [{ id: 1, commonCause: 'SLEEP' }],
    triggerTrends: [{ cause: 'SLEEP', count: 1 }],
    adherence: { finalDoses: 2, takenDoses: 1, rate: 50 },
    alerts: [
      {
        id: 'LOW_ADHERENCE',
        severity: 'MEDIUM',
        reason: 'Prototype threshold matched.',
        ruleVersion: 'prototype-1.0',
      },
    ],
    empty: false,
    ...overrides,
  };
}

describe('professional selected-period report', () => {
  test('renders an authorized summary, exact-value chart, trends, and alerts', async () => {
    const generateReport = { execute: jest.fn().mockResolvedValue(report()) };
    const onExport = jest.fn();
    render(
      <ProfessionalReportScreen
        generateReport={generateReport}
        initialPeriodEnd={PERIOD_END}
        onExport={onExport}
        patientId={1}
      />,
    );

    expect(
      await screen.findByLabelText('Relatório autorizado do período selecionado'),
    ).toBeOnTheScreen();
    expect(screen.getByText('Crises: 3')).toBeOnTheScreen();
    expect(
      screen.getByText('Adesão global: 50.0% (1 de 2 doses finais tomadas)'),
    ).toBeOnTheScreen();
    expect(
      screen.getByLabelText(/Gráfico do período: Crises 3, Possíveis gatilhos 1, Doses finais 2/),
    ).toBeOnTheScreen();
    expect(screen.getByText('Sono: 1')).toBeOnTheScreen();
    expect(screen.getByText('[Média] BAIXA ADESÃO')).toBeOnTheScreen();
    expect(
      screen.getByText(
        'Contagem de crises registradas no período; registros ausentes não são inferidos.',
      ),
    ).toBeOnTheScreen();
    expect(
      screen.getByText('Contagem de gatilhos registrados; não representa causa confirmada.'),
    ).toBeOnTheScreen();
    expect(
      screen.getByText(
        'Calculada sobre doses com confirmação final; doses sem confirmação não entram no cálculo.',
      ),
    ).toBeOnTheScreen();
    expect(screen.getByText(/Estes indicadores são informativos/)).toBeOnTheScreen();
    fireEvent.press(screen.getByRole('button', { name: 'Exportar relatório em JSON' }));
    expect(onExport).toHaveBeenCalledWith({
      patientId: 1,
      periodType: 'WEEKLY',
      periodEnd: PERIOD_END,
    });
    expect(generateReport.execute).toHaveBeenCalledWith({
      patientId: 1,
      periodType: 'WEEKLY',
      periodEnd: PERIOD_END,
    });
  });

  test('exports the loaded report period even if the selector changes afterwards', async () => {
    const generateReport = { execute: jest.fn().mockResolvedValue(report()) };
    const onExport = jest.fn();
    render(
      <ProfessionalReportScreen
        generateReport={generateReport}
        initialPeriodEnd={PERIOD_END}
        onExport={onExport}
        patientId={1}
      />,
    );

    expect(
      await screen.findByLabelText('Relatório autorizado do período selecionado'),
    ).toBeOnTheScreen();
    fireEvent.press(screen.getByRole('radio', { name: 'Mensal' }));
    fireEvent.press(screen.getByRole('button', { name: 'Exportar relatório em JSON' }));

    expect(onExport).toHaveBeenCalledWith({
      patientId: 1,
      periodType: 'WEEKLY',
      periodEnd: PERIOD_END,
    });
  });

  test('shows an explicit empty-period state without inferring adherence or risk', async () => {
    const generateReport = {
      execute: jest.fn().mockResolvedValue(
        report({
          seizures: [],
          triggers: [],
          triggerTrends: [],
          adherence: { finalDoses: 0, takenDoses: 0, rate: undefined },
          alerts: [],
          empty: true,
        }),
      ),
    };
    const onExport = jest.fn();
    render(
      <ProfessionalReportScreen
        generateReport={generateReport}
        initialPeriodEnd={PERIOD_END}
        onExport={onExport}
        patientId={1}
      />,
    );

    expect(await screen.findByText('Nenhum registro neste período')).toBeOnTheScreen();
    expect(screen.getByText(/Nenhuma taxa de adesão ou risco é inferida/)).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Exportar relatório em JSON' })).toBeOnTheScreen();
    expect(screen.getByText(/Estes indicadores são informativos/)).toBeOnTheScreen();
    expect(
      screen.queryByLabelText('Relatório autorizado do período selecionado'),
    ).not.toBeOnTheScreen();
  });

  test('clears report content and exposes no details when authorization is denied', async () => {
    const generateReport = { execute: jest.fn().mockRejectedValue(new ReportAccessDeniedError()) };
    const onExport = jest.fn();
    render(
      <ProfessionalReportScreen
        generateReport={generateReport}
        initialPeriodEnd={PERIOD_END}
        loadOnMount={false}
        onExport={onExport}
        patientId={1}
      />,
    );

    fireEvent.press(screen.getByRole('button', { name: 'Ver relatório selecionado' }));
    await waitFor(() => expect(screen.getByText('Acesso negado')).toBeOnTheScreen());
    expect(screen.queryByText(/Crises:/)).not.toBeOnTheScreen();
    expect(screen.queryByText(/Adesão global:/)).not.toBeOnTheScreen();
    expect(screen.queryByText('Alertas informativos')).not.toBeOnTheScreen();
    expect(
      screen.queryByRole('button', { name: 'Exportar relatório em JSON' }),
    ).not.toBeOnTheScreen();
    expect(screen.queryByText(/Estes indicadores são informativos/)).not.toBeOnTheScreen();
    expect(onExport).not.toHaveBeenCalled();
  });
});
