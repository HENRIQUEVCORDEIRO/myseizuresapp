import { act, create } from 'react-test-renderer';

import { PatientHome } from '../../app/(patient)/(tabs)/index.js';
import { ReportPeriodType } from '../../src/domain/rules/reportingRules.js';
import { ConsumptionStatus } from '../../src/domain/value-objects/index.js';
import { formatDateTime } from '../../src/presentation/formatters/index.js';

function createGenerateReport(overrides = {}) {
  return {
    execute: jest.fn().mockResolvedValue({
      adherence: { finalDoses: 3, rate: 66.66666666666666, takenDoses: 2 },
      alerts: [],
      period: { periodEnd: '2026-08-11T15:00:00.000Z', periodStart: '2026-08-05T00:00:00.000Z' },
      seizures: [{ id: 1 }, { id: 2 }],
      triggerTrends: [],
      triggers: [{ id: 1 }],
    }),
    ...overrides,
  };
}

function renderHome({
  confirmDose = { execute: jest.fn().mockResolvedValue({}) },
  generateReport = createGenerateReport(),
  listReminders = {
    execute: jest.fn().mockResolvedValue([
      { id: 1, scheduledAt: '2026-08-20T20:00:00.000Z' },
      { id: 2, scheduledAt: '2026-08-21T08:00:00.000Z' },
    ]),
  },
  onNavigate = jest.fn(),
  onSwitchProfile = jest.fn(),
} = {}) {
  let renderer;

  act(() => {
    renderer = create(
      <PatientHome
        confirmDose={confirmDose}
        generateReport={generateReport}
        listReminders={listReminders}
        onNavigate={onNavigate}
        onSwitchProfile={onSwitchProfile}
        patientId={1}
        user={{ id: 1, name: 'Patient One', role: 'PATIENT' }}
      />,
    );
  });

  return { confirmDose, generateReport, listReminders, onNavigate, onSwitchProfile, renderer };
}

describe('patient home', () => {
  test('offers the three quick actions with an accessible label and a destination', async () => {
    const { onNavigate, renderer } = renderHome();

    await act(async () => {});

    const actions = [
      ['Registrar crise', '/(patient)/seizures/new'],
      ['Registrar gatilho', '/(patient)/triggers/new'],
      ['Confirmar dose', '/(patient)/reminders'],
    ];

    for (const [label, href] of actions) {
      const card = renderer.root
        .findAllByProps({ accessibilityLabel: label })
        .find((element) => element.props.accessibilityRole === 'button');
      expect(card).toBeTruthy();
      await act(async () => {
        card.props.onPress();
      });
      expect(onNavigate).toHaveBeenCalledWith(href);
    }
  });

  test('shows the count of doses still waiting for confirmation', async () => {
    const { renderer } = renderHome();

    await act(async () => {});

    expect(
      renderer.root.findByProps({ accessibilityLabel: '2 doses para confirmar' }),
    ).toBeTruthy();
  });

  test('asks only for doses that are due and confirms the next one in one tap', async () => {
    const confirmDose = { execute: jest.fn().mockResolvedValue({}) };
    const { listReminders, renderer } = renderHome({ confirmDose });

    await act(async () => {});

    expect(listReminders.execute).toHaveBeenCalledWith({ through: expect.any(String) });

    const scheduledAt = formatDateTime('2026-08-20T20:00:00.000Z');
    const taken = renderer.root.findByProps({
      accessibilityLabel: `Confirmar dose de ${scheduledAt} como tomada`,
    });

    await act(async () => {
      taken.props.onPress();
    });

    expect(confirmDose.execute).toHaveBeenCalledWith({
      reminderId: 1,
      consumptionStatus: ConsumptionStatus.TAKEN,
    });
    expect(
      renderer.root.findByProps({ accessibilityLabel: 'Sucesso: Dose confirmada.' }),
    ).toBeTruthy();
  });

  test('keeps the dose visible when the one-tap confirmation fails', async () => {
    const confirmDose = { execute: jest.fn().mockRejectedValue(new Error('database unavailable')) };
    const { renderer } = renderHome({ confirmDose });

    await act(async () => {});

    const scheduledAt = formatDateTime('2026-08-20T20:00:00.000Z');
    await act(async () => {
      renderer.root
        .findByProps({
          accessibilityLabel: `Confirmar dose de ${scheduledAt} como não tomada`,
        })
        .props.onPress();
    });

    expect(
      renderer.root.findByProps({
        accessibilityLabel: 'Erro: Não foi possível confirmar a dose. Tente novamente.',
      }),
    ).toBeTruthy();
    expect(
      renderer.root.findByProps({
        accessibilityLabel: `Confirmar dose de ${scheduledAt} como tomada`,
      }),
    ).toBeTruthy();
  });

  test('summarises seizures, triggers, and adherence for the selected period', async () => {
    const { generateReport, renderer } = renderHome();

    await act(async () => {});

    expect(generateReport.execute).toHaveBeenCalledWith(
      expect.objectContaining({ patientId: 1, periodType: ReportPeriodType.WEEKLY }),
    );
    expect(renderer.root.findByProps({ accessibilityLabel: 'Crises: 2' })).toBeTruthy();
    expect(renderer.root.findByProps({ accessibilityLabel: 'Gatilhos: 1' })).toBeTruthy();
    expect(
      renderer.root.findByProps({
        accessibilityLabel: 'Adesão: 67%. 2 de 3 doses tomadas',
      }),
    ).toBeTruthy();
  });

  test('reloads the summary when a different period is chosen', async () => {
    const { generateReport, renderer } = renderHome();

    await act(async () => {});

    await act(async () => {
      renderer.root
        .findByProps({ accessibilityLabel: 'Período do resumo' })
        .findByProps({ accessibilityLabel: 'Mês' })
        .props.onPress();
    });

    expect(generateReport.execute).toHaveBeenLastCalledWith(
      expect.objectContaining({ periodType: ReportPeriodType.MONTHLY }),
    );
  });

  test('keeps the quick actions usable when the summary fails to load', async () => {
    const { renderer } = renderHome({
      generateReport: createGenerateReport({
        execute: jest.fn().mockRejectedValue(new Error('Local database is unavailable.')),
      }),
    });

    await act(async () => {});

    expect(renderer.root.findByProps({ accessibilityLabel: 'Registrar crise' })).toBeTruthy();
    expect(renderer.root.findAllByProps({ accessibilityRole: 'alert' }).length).toBeGreaterThan(0);
  });

  test('offers a recovery action when the summary fails to load', async () => {
    const generateReport = createGenerateReport({
      execute: jest.fn().mockRejectedValue(new Error('Local database is unavailable.')),
    });
    const { renderer } = renderHome({ generateReport });

    await act(async () => {});

    const retry = renderer.root.findByProps({
      accessibilityLabel: 'Tentar carregar o resumo novamente',
    });
    await act(async () => {
      retry.props.onPress();
    });

    expect(generateReport.execute).toHaveBeenCalledTimes(2);
  });

  test('signs the patient out and returns to authentication', async () => {
    const { onSwitchProfile, renderer } = renderHome();

    await act(async () => {});

    await act(async () => {
      renderer.root.findByProps({ accessibilityLabel: 'Trocar perfil' }).props.onPress();
    });

    expect(onSwitchProfile).toHaveBeenCalledTimes(1);
  });
});
