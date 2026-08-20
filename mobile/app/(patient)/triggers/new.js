import { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { getContainer } from '../../../src/composition/container.js';
import { TriggerCause } from '../../../src/domain/value-objects/index.js';
import {
  AccessibleButton,
  DateTimeField,
  FormFeedback,
  FormField,
  SelectField,
} from '../../../src/presentation/components/index.js';
import { useAuthSession } from '../../../src/presentation/navigation/index.js';

const CAUSE_OPTIONS = Object.freeze([
  { label: 'Sleep', value: TriggerCause.SLEEP },
  { label: 'Stress', value: TriggerCause.STRESS },
  { label: 'Medication', value: TriggerCause.MEDICATION },
  { label: 'Alcohol', value: TriggerCause.ALCOHOL },
  { label: 'Illness', value: TriggerCause.ILLNESS },
  { label: 'Routine change', value: TriggerCause.ROUTINE },
  { label: 'Other', value: TriggerCause.OTHER },
]);

const RATING_OPTIONS = Object.freeze(
  [1, 2, 3, 4, 5].map((value) => Object.freeze({ label: String(value), value })),
);

function requireFields({ commonCause, mood, otherDescription, recordedAt, sleepQuality }) {
  const errors = {};

  if (!recordedAt.trim()) errors.recordedAt = 'Date and time is required.';
  if (!commonCause) errors.commonCause = 'Cause is required.';
  if (sleepQuality === null) errors.sleepQuality = 'Sleep quality is required.';
  if (mood === null) errors.mood = 'Mood is required.';
  if (commonCause === TriggerCause.OTHER && !otherDescription.trim()) {
    errors.otherDescription = 'Describe the other cause.';
  }

  return errors;
}

export function TriggerEntryForm({ patientId, recordTrigger }) {
  const [recordedAt, setRecordedAt] = useState('');
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
        recordedAt: recordedAt.trim(),
        commonCause,
        ...(commonCause === TriggerCause.OTHER
          ? { otherDescription: otherDescription.trim() }
          : {}),
        sleepQuality,
        mood,
      });
      setFeedback({ message: 'Trigger saved.', variant: 'success' });
    } catch (error) {
      setFeedback({
        message: error?.message || 'The trigger could not be saved. Try again.',
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
            Record a possible trigger
          </Text>
          <Text style={styles.description}>
            Add possible context such as cause, sleep quality, and mood. This record is saved on
            this device.
          </Text>
        </View>
        <DateTimeField
          accessibilityHint="Enter when the possible trigger was recorded in UTC"
          error={errors.recordedAt}
          label="Trigger date and time"
          onChangeText={setRecordedAt}
          required
          value={recordedAt}
        />
        <SelectField
          accessibilityHint="Choose the most likely trigger cause"
          error={errors.commonCause}
          label="Cause"
          onValueChange={setCommonCause}
          options={CAUSE_OPTIONS}
          required
          value={commonCause}
        />
        {commonCause === TriggerCause.OTHER ? (
          <FormField
            accessibilityHint="Briefly describe the other possible cause"
            error={errors.otherDescription}
            label="Other cause description"
            onChangeText={setOtherDescription}
            value={otherDescription}
          />
        ) : null}
        <SelectField
          accessibilityHint="Rate sleep quality from 1, very poor, to 5, very good"
          error={errors.sleepQuality}
          label="Sleep quality"
          onValueChange={setSleepQuality}
          options={RATING_OPTIONS}
          required
          value={sleepQuality}
        />
        <SelectField
          accessibilityHint="Rate mood from 1, very low, to 5, very good"
          error={errors.mood}
          label="Mood"
          onValueChange={setMood}
          options={RATING_OPTIONS}
          required
          value={mood}
        />
        <FormFeedback message={feedback?.message} variant={feedback?.variant} />
        <AccessibleButton
          accessibilityHint="Validates and saves this trigger on the device"
          accessibilityLabel="Save trigger"
          busy={busy}
          onPress={submit}
          title="Save trigger"
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
