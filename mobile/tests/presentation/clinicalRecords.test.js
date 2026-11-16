import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import SeizureEntryScreen from '../../app/(patient)/seizures/new.js';
import TriggerEntryScreen from '../../app/(patient)/triggers/new.js';
import { FormDraftType } from '../../src/application/use-cases/drafts/index.js';
import { formatDateTime } from '../../src/presentation/formatters/index.js';

jest.mock('@react-native-community/datetimepicker', () => {
  const ReactModule = require('react');
  const { View } = require('react-native');

  return ({ onChange, testID }) => ReactModule.createElement(View, { onChange, testID });
});

const PATIENT_ID = 7;

function createCommand(result) {
  return {
    execute: jest.fn().mockResolvedValue(result),
  };
}

function createDraftStore(draft = null) {
  let current = draft;

  return {
    load: jest.fn(async () => current),
    save: jest.fn(async ({ formType, payload }) => {
      current = { formType, payload };
      return current;
    }),
    clear: jest.fn(async () => {
      current = null;
      return true;
    }),
  };
}

describe('patient clinical-record entry flows', () => {
  test('starts a new seizure at the current instant', () => {
    const now = '2026-08-11T15:00:00.000Z';
    jest.useFakeTimers();
    jest.setSystemTime(new Date(now));

    try {
      render(
        <SeizureEntryScreen patientId={PATIENT_ID} recordSeizure={createCommand({ id: 100 })} />,
      );

      expect(screen.getByText(formatDateTime(now))).toBeOnTheScreen();
    } finally {
      jest.useRealTimers();
    }
  });

  test('seizure entry reports required fields and confirms a successful save', async () => {
    const recordSeizure = createCommand({ id: 101 });
    render(<SeizureEntryScreen patientId={PATIENT_ID} recordSeizure={recordSeizure} />);

    fireEvent.press(screen.getByRole('button', { name: 'Salvar crise' }));

    expect(screen.queryByText('Informe a data e hora da crise.')).toBeNull();
    expect(screen.getByText('Informe o tipo de ocorrência.')).toBeOnTheScreen();
    expect(recordSeizure.execute).not.toHaveBeenCalled();

    const occurredAt = new Date(2026, 6, 10, 8, 30, 0, 0);

    fireEvent.press(screen.getByRole('button', { name: 'Escolher data — Data e hora da crise' }));
    fireEvent(
      screen.getByTestId('seizure-date-and-time-picker'),
      'onChange',
      { type: 'set' },
      new Date(2026, 6, 10),
    );
    fireEvent.press(screen.getByRole('button', { name: 'Escolher hora — Data e hora da crise' }));
    fireEvent(
      screen.getByTestId('seizure-date-and-time-picker'),
      'onChange',
      { type: 'set' },
      occurredAt,
    );
    fireEvent.press(screen.getByRole('radio', { name: 'Focal' }));
    fireEvent.press(screen.getByRole('button', { name: 'Salvar crise' }));

    await waitFor(() =>
      expect(recordSeizure.execute).toHaveBeenCalledWith({
        patientId: PATIENT_ID,
        occurredAt: occurredAt.toISOString(),
        occurrenceType: 'FOCAL',
        feltAura: false,
      }),
    );
    expect(await screen.findByText('Crise salva.')).toHaveProp('accessibilityRole', 'alert');
  });

  test('seizure entry records an aura when the patient reports it', async () => {
    const recordSeizure = createCommand({ id: 102 });
    render(
      <SeizureEntryScreen
        initialOccurredAt="2026-07-10T08:30:00.000Z"
        patientId={PATIENT_ID}
        recordSeizure={recordSeizure}
      />,
    );

    fireEvent.press(screen.getByRole('radio', { name: 'Generalizada' }));
    fireEvent.press(screen.getByRole('radio', { name: 'Sim' }));
    fireEvent.press(screen.getByRole('button', { name: 'Salvar crise' }));

    await waitFor(() =>
      expect(recordSeizure.execute).toHaveBeenCalledWith({
        patientId: PATIENT_ID,
        occurredAt: '2026-07-10T08:30:00.000Z',
        occurrenceType: 'GENERALIZED',
        feltAura: true,
      }),
    );
  });

  test('seizure entry saves an optional description in the patient words', async () => {
    const recordSeizure = createCommand({ id: 102 });
    render(
      <SeizureEntryScreen
        initialOccurredAt="2026-07-10T08:30:00.000Z"
        patientId={PATIENT_ID}
        recordSeizure={recordSeizure}
      />,
    );

    fireEvent.press(screen.getByRole('radio', { name: 'Focal' }));
    fireEvent.changeText(
      screen.getByLabelText('Descrição da crise (opcional)'),
      '  Formigamento no braço esquerdo e visão embaçada  ',
    );
    fireEvent.press(screen.getByRole('button', { name: 'Salvar crise' }));

    await waitFor(() =>
      expect(recordSeizure.execute).toHaveBeenCalledWith({
        patientId: PATIENT_ID,
        occurredAt: '2026-07-10T08:30:00.000Z',
        occurrenceType: 'FOCAL',
        feltAura: false,
        description: '  Formigamento no braço esquerdo e visão embaçada  ',
      }),
    );
  });

  test('restores and clears a saved seizure draft after a successful save', async () => {
    const manageFormDraft = createDraftStore({
      formType: FormDraftType.SEIZURE,
      payload: {
        description: 'Perda de consciência por cerca de um minuto',
        feltAura: true,
        occurredAt: '2026-07-10T08:30:00.000Z',
        occurrenceType: 'GENERALIZED',
      },
    });
    const recordSeizure = createCommand({ id: 103 });
    render(
      <SeizureEntryScreen
        manageFormDraft={manageFormDraft}
        patientId={PATIENT_ID}
        recordSeizure={recordSeizure}
      />,
    );

    expect(
      await screen.findByText('Rascunho restaurado. Continue o preenchimento.'),
    ).toBeOnTheScreen();
    expect(
      screen.getByRole('radio', { name: 'Generalizada' }).props.accessibilityState,
    ).toMatchObject({ checked: true });
    expect(screen.getByRole('radio', { name: 'Sim' }).props.accessibilityState).toMatchObject({
      checked: true,
    });
    expect(screen.getByLabelText('Descrição da crise (opcional)').props.value).toBe(
      'Perda de consciência por cerca de um minuto',
    );

    fireEvent.press(screen.getByRole('button', { name: 'Salvar crise' }));

    await waitFor(() =>
      expect(recordSeizure.execute).toHaveBeenCalledWith({
        patientId: PATIENT_ID,
        occurredAt: '2026-07-10T08:30:00.000Z',
        occurrenceType: 'GENERALIZED',
        feltAura: true,
        description: 'Perda de consciência por cerca de um minuto',
      }),
    );
    await waitFor(() =>
      expect(manageFormDraft.clear).toHaveBeenCalledWith({
        patientId: PATIENT_ID,
        formType: FormDraftType.SEIZURE,
      }),
    );
  });

  test('autosaves a seizure draft after the patient changes a restored field', async () => {
    const manageFormDraft = createDraftStore({
      formType: FormDraftType.SEIZURE,
      payload: {
        feltAura: false,
        occurredAt: '2026-07-10T08:30:00.000Z',
        occurrenceType: 'FOCAL',
      },
    });
    render(
      <SeizureEntryScreen
        manageFormDraft={manageFormDraft}
        patientId={PATIENT_ID}
        recordSeizure={createCommand({ id: 104 })}
      />,
    );

    await screen.findByText('Rascunho restaurado. Continue o preenchimento.');
    fireEvent.press(screen.getByRole('radio', { name: 'Generalizada' }));
    fireEvent.changeText(
      screen.getByLabelText('Descrição da crise (opcional)'),
      'Duração de aproximadamente dois minutos',
    );

    await waitFor(() =>
      expect(manageFormDraft.save).toHaveBeenCalledWith({
        patientId: PATIENT_ID,
        formType: FormDraftType.SEIZURE,
        payload: expect.objectContaining({
          description: 'Duração de aproximadamente dois minutos',
          occurrenceType: 'GENERALIZED',
        }),
      }),
    );
  });

  test('offers undo for a just-saved seizure and removes the record', async () => {
    const deleteSeizure = { execute: jest.fn().mockResolvedValue(true) };
    const recordSeizure = createCommand({ id: 105 });
    render(
      <SeizureEntryScreen
        deleteSeizure={deleteSeizure}
        initialOccurredAt="2026-07-10T08:30:00.000Z"
        patientId={PATIENT_ID}
        recordSeizure={recordSeizure}
      />,
    );

    fireEvent.press(screen.getByRole('radio', { name: 'Focal' }));
    fireEvent.press(screen.getByRole('button', { name: 'Salvar crise' }));

    const undoButton = await screen.findByRole('button', {
      name: 'Desfazer registro da crise',
    });
    fireEvent.press(undoButton);

    await waitFor(() =>
      expect(deleteSeizure.execute).toHaveBeenCalledWith({
        patientId: PATIENT_ID,
        recordId: 105,
      }),
    );
    expect(await screen.findByText('Registro desfeito.')).toBeOnTheScreen();
  });

  test('starts a new trigger at the current instant', () => {
    const now = '2026-08-11T15:00:00.000Z';
    jest.useFakeTimers();
    jest.setSystemTime(new Date(now));

    try {
      render(
        <TriggerEntryScreen patientId={PATIENT_ID} recordTrigger={createCommand({ id: 200 })} />,
      );

      expect(screen.getByText(formatDateTime(now))).toBeOnTheScreen();
    } finally {
      jest.useRealTimers();
    }
  });

  test('trigger entry reports required fields and saves multiple causes', async () => {
    const recordTrigger = createCommand({ id: 202 });
    render(
      <TriggerEntryScreen
        initialRecordedAt="2026-07-10T09:00:00.000Z"
        patientId={PATIENT_ID}
        recordTrigger={recordTrigger}
      />,
    );

    fireEvent.press(screen.getByRole('button', { name: 'Salvar gatilho' }));

    expect(screen.queryByText('Informe a data e hora do gatilho.')).toBeNull();
    expect(screen.getByText('Informe pelo menos uma causa.')).toBeOnTheScreen();
    expect(screen.getByText('Informe a qualidade do sono.')).toBeOnTheScreen();
    expect(screen.getByText('Informe o humor.')).toBeOnTheScreen();
    expect(recordTrigger.execute).not.toHaveBeenCalled();

    fireEvent.press(screen.getByLabelText('Causas do gatilho'));
    fireEvent.press(screen.getByLabelText('Sono'));
    fireEvent.press(screen.getByLabelText('Estresse'));
    fireEvent.press(screen.getByLabelText('Confirmar seleção'));

    expect(screen.getByText('Sono, Estresse')).toBeOnTheScreen();
    expect(screen.queryByText('Informe pelo menos uma causa.')).toBeNull();
    fireEvent.press(screen.getByRole('radio', { name: 'Qualidade do sono 2' }));
    fireEvent.press(screen.getByRole('radio', { name: 'Humor 3' }));
    fireEvent.press(screen.getByRole('button', { name: 'Salvar gatilho' }));

    await waitFor(() =>
      expect(recordTrigger.execute).toHaveBeenCalledWith({
        patientId: PATIENT_ID,
        recordedAt: '2026-07-10T09:00:00.000Z',
        causes: ['SLEEP', 'STRESS'],
        sleepQuality: 2,
        mood: 3,
      }),
    );
    expect(await screen.findByText('Gatilho salvo.')).toHaveProp('accessibilityRole', 'alert');
  });

  test('requires a description before an other trigger can be confirmed', async () => {
    const recordTrigger = createCommand({ id: 203 });
    render(
      <TriggerEntryScreen
        initialRecordedAt="2026-07-10T09:00:00.000Z"
        patientId={PATIENT_ID}
        recordTrigger={recordTrigger}
      />,
    );

    fireEvent.press(screen.getByLabelText('Causas do gatilho'));
    fireEvent.press(screen.getByLabelText('Outro'));
    fireEvent.press(screen.getByLabelText('Confirmar seleção'));

    expect(screen.getByText('Descreva a outra causa.')).toBeOnTheScreen();
    expect(screen.getByLabelText('Confirmar seleção')).toBeOnTheScreen();

    fireEvent.changeText(screen.getByLabelText('Descrição da outra opção'), 'Medicação esquecida');
    fireEvent.press(screen.getByLabelText('Confirmar seleção'));

    expect(screen.getByText('Outro')).toBeOnTheScreen();
    expect(screen.getByText('Outra causa: Medicação esquecida')).toBeOnTheScreen();

    fireEvent.press(screen.getByRole('radio', { name: 'Qualidade do sono 2' }));
    fireEvent.press(screen.getByRole('radio', { name: 'Humor 3' }));
    fireEvent.press(screen.getByRole('button', { name: 'Salvar gatilho' }));

    await waitFor(() =>
      expect(recordTrigger.execute).toHaveBeenCalledWith({
        patientId: PATIENT_ID,
        recordedAt: '2026-07-10T09:00:00.000Z',
        causes: ['OTHER'],
        otherDescription: 'Medicação esquecida',
        sleepQuality: 2,
        mood: 3,
      }),
    );
  });

  test('restores and clears a saved trigger draft after a successful save', async () => {
    const manageFormDraft = createDraftStore({
      formType: FormDraftType.TRIGGER,
      payload: {
        causes: ['SLEEP', 'STRESS'],
        mood: 3,
        otherDescription: '',
        recordedAt: '2026-07-10T09:00:00.000Z',
        sleepQuality: 2,
      },
    });
    const recordTrigger = createCommand({ id: 205 });
    render(
      <TriggerEntryScreen
        manageFormDraft={manageFormDraft}
        patientId={PATIENT_ID}
        recordTrigger={recordTrigger}
      />,
    );

    expect(
      await screen.findByText('Rascunho restaurado. Continue o preenchimento.'),
    ).toBeOnTheScreen();
    expect(screen.getByText('Sono, Estresse')).toBeOnTheScreen();
    expect(
      screen.getByRole('radio', { name: 'Qualidade do sono 2' }).props.accessibilityState,
    ).toMatchObject({ checked: true });
    expect(screen.getByRole('radio', { name: 'Humor 3' }).props.accessibilityState).toMatchObject({
      checked: true,
    });

    fireEvent.press(screen.getByRole('button', { name: 'Salvar gatilho' }));

    await waitFor(() =>
      expect(recordTrigger.execute).toHaveBeenCalledWith({
        patientId: PATIENT_ID,
        recordedAt: '2026-07-10T09:00:00.000Z',
        causes: ['SLEEP', 'STRESS'],
        sleepQuality: 2,
        mood: 3,
      }),
    );
    await waitFor(() =>
      expect(manageFormDraft.clear).toHaveBeenCalledWith({
        patientId: PATIENT_ID,
        formType: FormDraftType.TRIGGER,
      }),
    );
  });

  test('offers undo for a just-saved trigger and removes the record', async () => {
    const deleteTrigger = { execute: jest.fn().mockResolvedValue(true) };
    const recordTrigger = createCommand({ id: 206 });
    render(
      <TriggerEntryScreen
        deleteTrigger={deleteTrigger}
        initialRecordedAt="2026-07-10T09:00:00.000Z"
        patientId={PATIENT_ID}
        recordTrigger={recordTrigger}
      />,
    );

    fireEvent.press(screen.getByLabelText('Causas do gatilho'));
    fireEvent.press(screen.getByLabelText('Sono'));
    fireEvent.press(screen.getByLabelText('Confirmar seleção'));
    fireEvent.press(screen.getByRole('radio', { name: 'Qualidade do sono 2' }));
    fireEvent.press(screen.getByRole('radio', { name: 'Humor 3' }));
    fireEvent.press(screen.getByRole('button', { name: 'Salvar gatilho' }));

    const undoButton = await screen.findByRole('button', {
      name: 'Desfazer registro do gatilho',
    });
    fireEvent.press(undoButton);

    await waitFor(() =>
      expect(deleteTrigger.execute).toHaveBeenCalledWith({
        patientId: PATIENT_ID,
        recordId: 206,
      }),
    );
    expect(await screen.findByText('Registro desfeito.')).toBeOnTheScreen();
  });
});
