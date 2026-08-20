import { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { getContainer } from '../../../src/composition/container.js';
import { SeizureOccurrenceType } from '../../../src/domain/value-objects/index.js';
import {
  AccessibleButton,
  DateTimeField,
  FormFeedback,
  SelectField,
} from '../../../src/presentation/components/index.js';
import { useAuthSession } from '../../../src/presentation/navigation/index.js';

const OCCURRENCE_OPTIONS = Object.freeze([
  { label: 'Focal', value: SeizureOccurrenceType.FOCAL },
  { label: 'Generalized', value: SeizureOccurrenceType.GENERALIZED },
  { label: 'Unknown', value: SeizureOccurrenceType.UNKNOWN },
  { label: 'Other', value: SeizureOccurrenceType.OTHER },
]);

function requireFields({ occurredAt, occurrenceType }) {
  const errors = {};

  if (!occurredAt.trim()) {
    errors.occurredAt = 'Date and time is required.';
  }

  if (!occurrenceType) {
    errors.occurrenceType = 'Occurrence type is required.';
  }

  return errors;
}

export function SeizureEntryForm({ patientId, recordSeizure }) {
  const [occurredAt, setOccurredAt] = useState('');
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
      await recordSeizure.execute({ patientId, occurredAt: occurredAt.trim(), occurrenceType });
      setFeedback({ message: 'Seizure saved.', variant: 'success' });
    } catch (error) {
      setFeedback({
        message: error?.message || 'The seizure could not be saved. Try again.',
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
            Record a seizure
          </Text>
          <Text style={styles.description}>
            Add the date, time, and occurrence type. This record is saved on this device.
          </Text>
        </View>
        <DateTimeField
          accessibilityHint="Enter when the seizure occurred in UTC"
          error={errors.occurredAt}
          label="Seizure date and time"
          onChangeText={setOccurredAt}
          required
          value={occurredAt}
        />
        <SelectField
          accessibilityHint="Choose the seizure occurrence type"
          error={errors.occurrenceType}
          label="Occurrence type"
          onValueChange={setOccurrenceType}
          options={OCCURRENCE_OPTIONS}
          required
          value={occurrenceType}
        />
        <FormFeedback message={feedback?.message} variant={feedback?.variant} />
        <AccessibleButton
          accessibilityHint="Validates and saves this seizure on the device"
          accessibilityLabel="Save seizure"
          busy={busy}
          onPress={submit}
          title="Save seizure"
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
