import { useEffect, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { FormDraftType } from '../../../src/application/use-cases/drafts/index.js';
import { getContainer } from '../../../src/composition/container.js';
import { TriggerCause } from '../../../src/domain/value-objects/index.js';
import {
  AccessibleButton,
  FormFeedback,
  NativeDateTimeField,
  RatingField,
  SelectSheet,
} from '../../../src/presentation/components/index.js';
import { TRIGGER_CAUSE_LABELS } from '../../../src/presentation/labels.js';
import { useFormDraft } from '../../../src/presentation/hooks/useFormDraft.js';
import { useAuthSession } from '../../../src/presentation/navigation/index.js';

const CAUSE_OPTIONS = Object.freeze(
  Object.values(TriggerCause).map((value) => ({
    label: TRIGGER_CAUSE_LABELS[value],
    value,
  })),
);

function nowTimestamp() {
  return new Date().toISOString();
}

function isValidTimestamp(value) {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

function validRating(value) {
  return Number.isInteger(value) && value >= 1 && value <= 5 ? value : null;
}

function causeSummary(causes) {
  if (causes.length === 0) return 'Selecionar causas';
  return causes.map((cause) => TRIGGER_CAUSE_LABELS[cause]).join(', ');
}

function requireFields({ causes, mood, otherDescription, recordedAt, sleepQuality }) {
  const errors = {};

  if (!recordedAt) errors.recordedAt = 'Informe a data e hora do gatilho.';
  if (causes.length === 0) errors.causes = 'Informe pelo menos uma causa.';
  if (sleepQuality === null) errors.sleepQuality = 'Informe a qualidade do sono.';
  if (mood === null) errors.mood = 'Informe o humor.';
  if (causes.includes(TriggerCause.OTHER) && !otherDescription.trim()) {
    errors.otherDescription = 'Descreva a outra causa.';
  }

  return errors;
}

export function TriggerEntryForm({
  deleteTrigger,
  initialRecordedAt = null,
  manageFormDraft,
  patientId,
  recordTrigger,
}) {
  const [recordedAt, setRecordedAt] = useState(() => initialRecordedAt ?? nowTimestamp());
  const [causes, setCauses] = useState([]);
  const [otherDescription, setOtherDescription] = useState('');
  const [sleepQuality, setSleepQuality] = useState(null);
  const [mood, setMood] = useState(null);
  const [sheetVisible, setSheetVisible] = useState(false);
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
    setRecordedAt(
      isValidTimestamp(payload.recordedAt)
        ? payload.recordedAt
        : (initialRecordedAt ?? nowTimestamp()),
    );
    setCauses(
      Array.isArray(payload.causes)
        ? [
            ...new Set(
              payload.causes.filter((cause) =>
                CAUSE_OPTIONS.some((option) => option.value === cause),
              ),
            ),
          ]
        : [],
    );
    setOtherDescription(
      typeof payload.otherDescription === 'string' ? payload.otherDescription : '',
    );
    setSleepQuality(validRating(payload.sleepQuality));
    setMood(validRating(payload.mood));
  }

  const { clearDraft, draftRestored } = useFormDraft({
    formType: FormDraftType.TRIGGER,
    manageFormDraft,
    onRestore: restoreDraft,
    patientId,
    payload: { causes, mood, otherDescription, recordedAt, sleepQuality },
  });

  function clearCauseErrors() {
    setErrors((current) => {
      if (!current.causes && !current.otherDescription) return current;

      const next = { ...current };
      delete next.causes;
      delete next.otherDescription;
      return next;
    });
  }

  function confirmCauses({ other, values }) {
    setCauses(values);
    setOtherDescription(other ?? '');
    clearCauseErrors();
    setSheetVisible(false);
  }

  async function submit() {
    const values = { causes, mood, otherDescription, recordedAt, sleepQuality };
    const validationErrors = requireFields(values);
    setErrors(validationErrors);
    setFeedback(null);
    setUndoRecordId(null);

    if (Object.keys(validationErrors).length > 0) return;

    setBusy(true);

    try {
      const saved = await recordTrigger.execute({
        patientId,
        recordedAt,
        causes,
        ...(causes.includes(TriggerCause.OTHER)
          ? { otherDescription: otherDescription.trim() }
          : {}),
        sleepQuality,
        mood,
      });
      await clearDraft();
      setFeedback({ message: 'Gatilho salvo.', variant: 'success' });
      setUndoRecordId(deleteTrigger && Number.isInteger(saved?.id) ? saved.id : null);
      setCauses([]);
      setOtherDescription('');
      setSleepQuality(null);
      setMood(null);
      setRecordedAt(nowTimestamp());
    } catch {
      setFeedback({
        message: 'Não foi possível salvar o gatilho. Tente novamente.',
        variant: 'error',
      });
    } finally {
      setBusy(false);
    }
  }

  async function undo() {
    if (!deleteTrigger || undoRecordId === null) return;

    setBusy(true);

    try {
      await deleteTrigger.execute({ patientId, recordId: undoRecordId });
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

  const summary = causeSummary(causes);
  const hasOther = causes.includes(TriggerCause.OTHER);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.heading}>
          <Text accessibilityRole="header" style={styles.title}>
            Registrar um possível gatilho
          </Text>
          <Text style={styles.description}>
            Informe contextos possíveis, como causas, qualidade do sono e humor. Este registro é
            salvo neste aparelho.
          </Text>
          {draftRestored ? (
            <Text accessibilityLiveRegion="polite" style={styles.draftNotice}>
              Rascunho restaurado. Continue o preenchimento.
            </Text>
          ) : null}
        </View>
        <NativeDateTimeField
          accessibilityHint="Escolha quando o possível gatilho ocorreu"
          error={errors.recordedAt}
          label="Data e hora do gatilho"
          maximumDate={new Date()}
          onValueChange={setRecordedAt}
          required
          testID="trigger-date-and-time"
          value={recordedAt}
        />
        <View style={styles.field}>
          <Text style={styles.label}>Causas *</Text>
          <Pressable
            accessibilityHint="Abre a seleção de uma ou mais causas"
            accessibilityLabel="Causas do gatilho"
            accessibilityRole="button"
            accessibilityState={{ invalid: Boolean(errors.causes) }}
            accessibilityValue={{ text: summary }}
            onPress={() => setSheetVisible(true)}
            style={({ pressed }) => [
              styles.select,
              errors.causes ? styles.invalidSelect : null,
              pressed ? styles.pressed : null,
            ]}
          >
            <Text style={[styles.selectLabel, causes.length === 0 ? styles.placeholder : null]}>
              {summary}
            </Text>
            <Text accessibilityElementsHidden style={styles.chevron}>
              ⌄
            </Text>
          </Pressable>
          <FormFeedback message={errors.causes} />
          {hasOther && otherDescription ? (
            <Text style={styles.otherSummary}>Outra causa: {otherDescription}</Text>
          ) : null}
          <FormFeedback message={errors.otherDescription} />
        </View>
        <RatingField
          accessibilityHint="Avalie a qualidade do sono de 1, muito ruim, a 5, muito boa"
          error={errors.sleepQuality}
          label="Qualidade do sono"
          onValueChange={setSleepQuality}
          required
          value={sleepQuality}
        />
        <RatingField
          accessibilityHint="Avalie o humor de 1, muito baixo, a 5, muito bom"
          error={errors.mood}
          label="Humor"
          onValueChange={setMood}
          required
          value={mood}
        />
        <FormFeedback message={feedback?.message} variant={feedback?.variant} />
        {undoRecordId !== null ? (
          <AccessibleButton
            accessibilityHint="Remove o gatilho que você acabou de salvar"
            accessibilityLabel="Desfazer registro do gatilho"
            busy={busy}
            onPress={undo}
            title="Desfazer"
            variant="secondary"
          />
        ) : null}
        <AccessibleButton
          accessibilityHint="Valida e salva este gatilho no aparelho"
          accessibilityLabel="Salvar gatilho"
          busy={busy}
          disabled={busy || (hasOther && !otherDescription.trim())}
          onPress={submit}
          title="Salvar gatilho"
        />
      </ScrollView>
      <SelectSheet
        allowOther
        multiple
        onClose={() => setSheetVisible(false)}
        onConfirm={confirmCauses}
        options={CAUSE_OPTIONS}
        otherText={otherDescription}
        title="Causas do gatilho"
        values={causes}
        visible={sheetVisible}
      />
    </SafeAreaView>
  );
}

function ConnectedTriggerEntryScreen() {
  const { user } = useAuthSession();
  const patientId = user?.patientId ?? user?.id;
  const { deleteTrigger, manageFormDraft, recordTrigger } =
    getContainer().clinicalForPatient(patientId);

  return (
    <TriggerEntryForm
      deleteTrigger={deleteTrigger}
      manageFormDraft={manageFormDraft}
      patientId={patientId}
      recordTrigger={recordTrigger}
    />
  );
}

export default function TriggerEntryScreen(props) {
  if (props?.recordTrigger) {
    return <TriggerEntryForm {...props} />;
  }

  return <ConnectedTriggerEntryScreen />;
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#F8FAFC', flex: 1 },
  content: { flexGrow: 1, gap: 20, padding: 24, paddingBottom: 96 },
  heading: { gap: 8, marginBottom: 4 },
  title: { color: '#17324D', fontSize: 28, fontWeight: '700' },
  description: { color: '#334155', fontSize: 16, lineHeight: 24 },
  draftNotice: { color: '#175CD3', fontSize: 14, lineHeight: 20 },
  field: { gap: 8 },
  label: { color: '#17324D', fontSize: 15, fontWeight: '600' },
  select: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#CBD5E1',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  invalidSelect: { borderColor: '#B42318' },
  pressed: { opacity: 0.8 },
  selectLabel: { color: '#17324D', flex: 1, fontSize: 16 },
  placeholder: { color: '#64748B' },
  chevron: { color: '#175CD3', fontSize: 20, fontWeight: '700' },
  otherSummary: { color: '#334155', fontSize: 14, lineHeight: 20 },
});
