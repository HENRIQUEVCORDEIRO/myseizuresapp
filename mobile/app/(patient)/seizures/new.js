import { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { FormDraftType } from '../../../src/application/use-cases/drafts/index.js';
import { getContainer } from '../../../src/composition/container.js';
import { SeizureOccurrenceType } from '../../../src/domain/value-objects/index.js';
import {
  AccessibleButton,
  ChoiceGroup,
  FormFeedback,
  NativeDateTimeField,
} from '../../../src/presentation/components/index.js';
import { OCCURRENCE_TYPE_LABELS } from '../../../src/presentation/labels.js';
import { useFormDraft } from '../../../src/presentation/hooks/useFormDraft.js';
import { useAuthSession } from '../../../src/presentation/navigation/index.js';

const OCCURRENCE_OPTIONS = Object.freeze(
  Object.values(SeizureOccurrenceType).map((value) => ({
    label: OCCURRENCE_TYPE_LABELS[value],
    value,
  })),
);

const AURA_OPTIONS = Object.freeze([
  { label: 'Sim', value: true },
  { label: 'Não', value: false },
]);

function requireFields({ occurredAt, occurrenceType }) {
  const errors = {};

  if (!occurredAt) {
    errors.occurredAt = 'Informe a data e hora da crise.';
  }

  if (!occurrenceType) {
    errors.occurrenceType = 'Informe o tipo de ocorrência.';
  } else if (!OCCURRENCE_OPTIONS.some((option) => option.value === occurrenceType)) {
    errors.occurrenceType = 'Escolha um tipo de ocorrência válido.';
  }

  return errors;
}

function isValidTimestamp(value) {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

export function SeizureEntryForm({
  deleteSeizure,
  initialOccurredAt = null,
  manageFormDraft,
  patientId,
  recordSeizure,
}) {
  const [occurredAt, setOccurredAt] = useState(() => initialOccurredAt ?? new Date().toISOString());
  const [occurrenceType, setOccurrenceType] = useState(null);
  const [feltAura, setFeltAura] = useState(false);
  const [errors, setErrors] = useState({});
  const [feedback, setFeedback] = useState(null);
  const [busy, setBusy] = useState(false);
  const [undoRecordId, setUndoRecordId] = useState(null);

  useEffect(() => {
    if (undoRecordId === null) return undefined;

    const timer = setTimeout(() => setUndoRecordId(null), 5000);

    return () => clearTimeout(timer);
  }, [undoRecordId]);

  function restoreDraft(payload) {
    setOccurredAt(
      isValidTimestamp(payload.occurredAt)
        ? payload.occurredAt
        : (initialOccurredAt ?? new Date().toISOString()),
    );
    setOccurrenceType(
      OCCURRENCE_OPTIONS.some((option) => option.value === payload.occurrenceType)
        ? payload.occurrenceType
        : null,
    );
    setFeltAura(typeof payload.feltAura === 'boolean' ? payload.feltAura : false);
  }

  const { clearDraft, draftRestored } = useFormDraft({
    formType: FormDraftType.SEIZURE,
    manageFormDraft,
    onRestore: restoreDraft,
    patientId,
    payload: { feltAura, occurredAt, occurrenceType },
  });

  async function submit() {
    const validationErrors = requireFields({ occurredAt, occurrenceType });
    setErrors(validationErrors);
    setFeedback(null);
    setUndoRecordId(null);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setBusy(true);

    try {
      const saved = await recordSeizure.execute({
        patientId,
        occurredAt,
        occurrenceType,
        feltAura,
      });
      await clearDraft();
      setFeedback({ message: 'Crise salva.', variant: 'success' });
      setUndoRecordId(deleteSeizure && Number.isInteger(saved?.id) ? saved.id : null);
      setOccurrenceType(null);
      setFeltAura(false);
      setOccurredAt(new Date().toISOString());
    } catch {
      setFeedback({
        message: 'Não foi possível salvar a crise. Tente novamente.',
        variant: 'error',
      });
    } finally {
      setBusy(false);
    }
  }

  async function undo() {
    if (!deleteSeizure || undoRecordId === null) return;

    setBusy(true);

    try {
      await deleteSeizure.execute({ patientId, recordId: undoRecordId });
      setUndoRecordId(null);
      setFeedback({ message: 'Registro desfeito.', variant: 'info' });
    } catch {
      setFeedback({
        message: 'Não foi possível desfazer o registro. Tente novamente.',
        variant: 'error',
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.heading}>
          <Text accessibilityRole="header" style={styles.title}>
            Registrar uma crise
          </Text>
          <Text style={styles.description}>
            O horário atual já vem preenchido. Ajuste se precisar e escolha o tipo de ocorrência.
            Este registro é salvo neste aparelho.
          </Text>
          {draftRestored ? (
            <Text accessibilityLiveRegion="polite" style={styles.draftNotice}>
              Rascunho restaurado. Continue o preenchimento.
            </Text>
          ) : null}
        </View>
        <NativeDateTimeField
          accessibilityHint="Escolha quando a crise ocorreu"
          error={errors.occurredAt}
          label="Data e hora da crise"
          maximumDate={new Date()}
          onValueChange={setOccurredAt}
          required
          testID="seizure-date-and-time"
          value={occurredAt}
        />
        <ChoiceGroup
          accessibilityHint="Escolha o tipo de ocorrência da crise"
          error={errors.occurrenceType}
          label="Tipo de ocorrência"
          onValueChange={setOccurrenceType}
          options={OCCURRENCE_OPTIONS}
          required
          value={occurrenceType}
        />
        <ChoiceGroup
          accessibilityHint="Informe se você sentiu que a crise viria"
          label="Sentiu que viria?"
          onValueChange={setFeltAura}
          options={AURA_OPTIONS}
          value={feltAura}
        />
        <FormFeedback message={feedback?.message} variant={feedback?.variant} />
        {undoRecordId !== null ? (
          <AccessibleButton
            accessibilityHint="Remove a crise que você acabou de salvar"
            accessibilityLabel="Desfazer registro da crise"
            busy={busy}
            onPress={undo}
            title="Desfazer"
            variant="secondary"
          />
        ) : null}
        <AccessibleButton
          accessibilityHint="Valida e salva esta crise no aparelho"
          accessibilityLabel="Salvar crise"
          busy={busy}
          onPress={submit}
          title="Salvar crise"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function ConnectedSeizureEntryScreen() {
  const { user } = useAuthSession();
  const patientId = user?.patientId ?? user?.id;
  const { deleteSeizure, manageFormDraft, recordSeizure } =
    getContainer().clinicalForPatient(patientId);

  return (
    <SeizureEntryForm
      deleteSeizure={deleteSeizure}
      manageFormDraft={manageFormDraft}
      patientId={patientId}
      recordSeizure={recordSeizure}
    />
  );
}

export default function SeizureEntryScreen(props) {
  if (props?.recordSeizure) {
    return <SeizureEntryForm {...props} />;
  }

  return <ConnectedSeizureEntryScreen />;
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#F8FAFC', flex: 1 },
  content: { flexGrow: 1, gap: 20, padding: 24, paddingBottom: 96 },
  heading: { gap: 8, marginBottom: 4 },
  title: { color: '#17324D', fontSize: 28, fontWeight: '700' },
  description: { color: '#334155', fontSize: 16, lineHeight: 24 },
  draftNotice: { color: '#175CD3', fontSize: 14, lineHeight: 20 },
});
