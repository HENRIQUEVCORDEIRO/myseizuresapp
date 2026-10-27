import { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { getContainer } from '../../../src/composition/container.js';
import { SeizureOccurrenceType } from '../../../src/domain/value-objects/index.js';
import {
  AccessibleButton,
  FormFeedback,
  NativeDateTimeField,
  SelectField,
} from '../../../src/presentation/components/index.js';
import { OCCURRENCE_TYPE_LABELS } from '../../../src/presentation/labels.js';
import { useAuthSession } from '../../../src/presentation/navigation/index.js';

const OCCURRENCE_OPTIONS = Object.freeze(
  Object.values(SeizureOccurrenceType).map((value) => ({
    label: OCCURRENCE_TYPE_LABELS[value],
    value,
  })),
);

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

export function SeizureEntryForm({ initialOccurredAt = null, patientId, recordSeizure }) {
  const [occurredAt, setOccurredAt] = useState(initialOccurredAt);
  const [occurrenceType, setOccurrenceType] = useState(null);
  const [errors, setErrors] = useState({});
  const [feedback, setFeedback] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    const validationErrors = requireFields({ occurredAt, occurrenceType });
    setErrors(validationErrors);
    setFeedback(null);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setBusy(true);

    try {
      await recordSeizure.execute({ patientId, occurredAt, occurrenceType });
      setFeedback({ message: 'Crise salva.', variant: 'success' });
    } catch {
      setFeedback({
        message: 'Não foi possível salvar a crise. Tente novamente.',
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
            Informe a data, a hora e o tipo de ocorrência. Este registro é salvo neste aparelho.
          </Text>
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
        <SelectField
          accessibilityHint="Escolha o tipo de ocorrência da crise"
          error={errors.occurrenceType}
          label="Tipo de ocorrência"
          onValueChange={setOccurrenceType}
          options={OCCURRENCE_OPTIONS}
          required
          value={occurrenceType}
        />
        <FormFeedback message={feedback?.message} variant={feedback?.variant} />
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
  const { recordSeizure } = getContainer().clinicalForPatient(patientId);

  return <SeizureEntryForm patientId={patientId} recordSeizure={recordSeizure} />;
}

export default function SeizureEntryScreen(props) {
  if (props?.recordSeizure) {
    return <SeizureEntryForm {...props} />;
  }

  return <ConnectedSeizureEntryScreen />;
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#F8FAFC', flex: 1 },
  content: { flexGrow: 1, gap: 20, padding: 24 },
  heading: { gap: 8, marginBottom: 4 },
  title: { color: '#17324D', fontSize: 28, fontWeight: '700' },
  description: { color: '#334155', fontSize: 16, lineHeight: 24 },
});
