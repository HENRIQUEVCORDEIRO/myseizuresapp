import { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text } from 'react-native';
import { getContainer } from '../../../src/composition/container.js';
import { TreatmentType } from '../../../src/domain/value-objects/index.js';
import {
  AccessibleButton,
  FormFeedback,
  FormField,
  SelectField,
} from '../../../src/presentation/components/index.js';
import { useAuthSession } from '../../../src/presentation/navigation/index.js';

const TYPES = Object.entries(TreatmentType).map(([label, value]) => ({ label, value }));

export function TreatmentForm({ manageTreatment, initialTreatment = null }) {
  const [name, setName] = useState(initialTreatment?.name ?? '');
  const [type, setType] = useState(initialTreatment?.type ?? TreatmentType.MEDICATION);
  const [times, setTimes] = useState(initialTreatment?.baseTimes?.join(', ') ?? '');
  const [feedback, setFeedback] = useState(null);
  const [busy, setBusy] = useState(false);
  async function submit() {
    const baseTimes = times
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    if (!name.trim() || baseTimes.length === 0) {
      setFeedback({ variant: 'error', message: 'Name and at least one time are required.' });
      return;
    }
    setBusy(true);
    try {
      const result = await manageTreatment.execute({
        id: initialTreatment?.id,
        type,
        name: name.trim(),
        dailyFrequency: baseTimes.length,
        baseTimes,
        active: initialTreatment?.active ?? true,
      });
      setFeedback({
        variant: 'success',
        message: result.delivery.inApp.length
          ? 'Treatment saved. Reminders are available in the app.'
          : 'Treatment and notifications saved.',
      });
    } catch (error) {
      setFeedback({ variant: 'error', message: error?.message ?? 'Treatment could not be saved.' });
    } finally {
      setBusy(false);
    }
  }
  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text accessibilityRole="header" style={styles.title}>
          {initialTreatment ? 'Edit treatment' : 'New treatment'}
        </Text>
        <FormField label="Treatment name" value={name} onChangeText={setName} />
        <SelectField label="Treatment type" value={type} onValueChange={setType} options={TYPES} />
        <FormField
          accessibilityHint="Separate times with commas, using 24-hour HH:MM format"
          label="Daily times"
          placeholder="08:00, 20:00"
          value={times}
          onChangeText={setTimes}
        />
        <FormFeedback {...feedback} />
        <AccessibleButton
          title="Save treatment"
          accessibilityLabel="Save treatment"
          busy={busy}
          onPress={submit}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function Connected() {
  const { user } = useAuthSession();
  const patientId = user?.patientId ?? user?.id;
  return (
    <TreatmentForm
      manageTreatment={getContainer().treatmentForPatient(patientId).manageTreatment}
    />
  );
}
export default function NewTreatmentScreen(props) {
  return props?.manageTreatment ? <TreatmentForm {...props} /> : <Connected />;
}
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { gap: 18, padding: 24 },
  title: { color: '#17324D', fontSize: 28, fontWeight: '700' },
});
