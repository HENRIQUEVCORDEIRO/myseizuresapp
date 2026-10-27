import { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { getContainer } from '../../../src/composition/container.js';
import { TriggerCause } from '../../../src/domain/value-objects/index.js';
import {
  AccessibleButton,
  FormFeedback,
  FormField,
  NativeDateTimeField,
  RatingField,
  SelectField,
} from '../../../src/presentation/components/index.js';
import { TRIGGER_CAUSE_LABELS } from '../../../src/presentation/labels.js';
import { useAuthSession } from '../../../src/presentation/navigation/index.js';

const CAUSE_OPTIONS = Object.freeze(
  Object.values(TriggerCause).map((value) => ({
    label: TRIGGER_CAUSE_LABELS[value],
    value,
  })),
);

function requireFields({ commonCause, mood, otherDescription, recordedAt, sleepQuality }) {
  const errors = {};

  if (!recordedAt) errors.recordedAt = 'Informe a data e hora do gatilho.';
  if (!commonCause) errors.commonCause = 'Informe a causa.';
  if (sleepQuality === null) errors.sleepQuality = 'Informe a qualidade do sono.';
  if (mood === null) errors.mood = 'Informe o humor.';
  if (commonCause === TriggerCause.OTHER && !otherDescription.trim()) {
    errors.otherDescription = 'Descreva a outra causa.';
  }

  return errors;
}

export function TriggerEntryForm({ initialRecordedAt = null, patientId, recordTrigger }) {
  const [recordedAt, setRecordedAt] = useState(initialRecordedAt);
  const [commonCause, setCommonCause] = useState(null);
  const [otherDescription, setOtherDescription] = useState('');
  const [sleepQuality, setSleepQuality] = useState(null);
  const [mood, setMood] = useState(null);
  const [errors, setErrors] = useState({});
  const [feedback, setFeedback] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    const values = { commonCause, mood, otherDescription, recordedAt, sleepQuality };
    const validationErrors = requireFields(values);
    setErrors(validationErrors);
    setFeedback(null);

    if (Object.keys(validationErrors).length > 0) return;

    setBusy(true);

    try {
      await recordTrigger.execute({
        patientId,
        recordedAt,
        commonCause,
        ...(commonCause === TriggerCause.OTHER
          ? { otherDescription: otherDescription.trim() }
          : {}),
        sleepQuality,
        mood,
      });
      setFeedback({ message: 'Gatilho salvo.', variant: 'success' });
    } catch {
      setFeedback({
        message: 'Não foi possível salvar o gatilho. Tente novamente.',
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
            Registrar um possível gatilho
          </Text>
          <Text style={styles.description}>
            Informe contextos possíveis, como causa, qualidade do sono e humor. Este registro é
            salvo neste aparelho.
          </Text>
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
        <SelectField
          accessibilityHint="Escolha a causa mais provável do gatilho"
          error={errors.commonCause}
          label="Causa"
          onValueChange={setCommonCause}
          options={CAUSE_OPTIONS}
          required
          value={commonCause}
        />
        {commonCause === TriggerCause.OTHER ? (
          <FormField
            accessibilityHint="Descreva brevemente a outra possível causa"
            error={errors.otherDescription ?? 'Descreva a outra causa.'}
            label="Descrição da outra causa"
            onChangeText={setOtherDescription}
            value={otherDescription}
          />
        ) : null}
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
        <AccessibleButton
          accessibilityHint="Valida e salva este gatilho no aparelho"
          accessibilityLabel="Salvar gatilho"
          busy={busy}
          disabled={commonCause === TriggerCause.OTHER && !otherDescription.trim()}
          onPress={submit}
          title="Salvar gatilho"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function ConnectedTriggerEntryScreen() {
  const { user } = useAuthSession();
  const patientId = user?.patientId ?? user?.id;
  const { recordTrigger } = getContainer().clinicalForPatient(patientId);

  return <TriggerEntryForm patientId={patientId} recordTrigger={recordTrigger} />;
}

export default function TriggerEntryScreen(props) {
  if (props?.recordTrigger) {
    return <TriggerEntryForm {...props} />;
  }

  return <ConnectedTriggerEntryScreen />;
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#F8FAFC', flex: 1 },
  content: { flexGrow: 1, gap: 20, padding: 24 },
  heading: { gap: 8, marginBottom: 4 },
  title: { color: '#17324D', fontSize: 28, fontWeight: '700' },
  description: { color: '#334155', fontSize: 16, lineHeight: 24 },
});
