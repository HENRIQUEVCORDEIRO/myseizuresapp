import { useState } from 'react';
import { Link } from 'expo-router';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { getContainer } from '../../../src/composition/container.js';
import {
  AccessibleButton,
  ApplicationState,
  FormField,
} from '../../../src/presentation/components/index.js';

export function ProfessionalPatientAccess({ authorizePatientAccess }) {
  const [patientIdInput, setPatientIdInput] = useState('');
  const [patientId, setPatientId] = useState(null);
  const [fieldError, setFieldError] = useState(null);
  const [status, setStatus] = useState('idle');

  async function checkAccess() {
    const selectedPatientId = Number(patientIdInput);
    if (!Number.isInteger(selectedPatientId) || selectedPatientId < 1) {
      setFieldError('Enter a positive patient identifier.');
      setPatientId(null);
      setStatus('idle');
      return;
    }

    setFieldError(null);
    setPatientId(null);
    setStatus('checking');
    let result;
    try {
      result = await authorizePatientAccess.execute({ patientId: selectedPatientId });
    } catch {
      setStatus('error');
      return;
    }

    if (!result.ok) {
      setStatus('error');
      return;
    }

    if (!result.value.allowed) {
      setStatus('denied');
      return;
    }

    setPatientId(selectedPatientId);
    setStatus('allowed');
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.heading}>
          <Text accessibilityRole="header" style={styles.title}>
            Patient access
          </Text>
          <Text style={styles.description}>
            Enter a patient identifier to verify an active sharing relationship.
          </Text>
        </View>
        <FormField
          accessibilityHint="Enter the numeric identifier shared by the patient"
          error={fieldError}
          keyboardType="number-pad"
          label="Patient identifier"
          onChangeText={setPatientIdInput}
          value={patientIdInput}
        />
        <AccessibleButton
          accessibilityHint="Checks whether this patient currently grants you access"
          accessibilityLabel="Check patient access"
          busy={status === 'checking'}
          onPress={checkAccess}
          title="Check access"
        />

        {status === 'allowed' ? (
          <View accessibilityRole="summary" style={styles.allowedCard}>
            <Text accessibilityRole="header" style={styles.allowedTitle}>
              Active access confirmed
            </Text>
            <Text style={styles.description}>
              You may review patient {patientId}'s selected-period report.
            </Text>
            <Link
              accessibilityHint="Opens the authorized selected-period clinical report"
              accessibilityLabel={`Open report for patient ${patientId}`}
              href={{ pathname: '/(professional)/reports/[patientId]', params: { patientId } }}
              style={styles.link}
            >
              Open report
            </Link>
          </View>
        ) : null}
        {status === 'denied' ? (
          <ApplicationState
            message="This patient has not granted you active access. No clinical information is available."
            title="Access denied"
            variant="forbidden"
          />
        ) : null}
        {status === 'error' ? (
          <ApplicationState
            message="Access could not be verified. No clinical information is available."
            title="Access check unavailable"
            variant="error"
          />
        ) : null}
        {status === 'idle' ? (
          <Text accessibilityLiveRegion="polite" style={styles.prompt}>
            No patient selected.
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

export default function ProfessionalPatientsScreen(props) {
  const authorizePatientAccess =
    props?.authorizePatientAccess ?? getContainer().authorizePatientAccess;
  return <ProfessionalPatientAccess authorizePatientAccess={authorizePatientAccess} />;
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#F8FAFC', flex: 1 },
  content: { flexGrow: 1, gap: 20, padding: 24 },
  heading: { gap: 8 },
  title: { color: '#17324D', fontSize: 28, fontWeight: '700' },
  description: { color: '#334155', fontSize: 16, lineHeight: 24 },
  prompt: { color: '#475467', fontSize: 15, textAlign: 'center' },
  allowedCard: {
    backgroundColor: '#ECFDF3',
    borderLeftColor: '#067647',
    borderLeftWidth: 4,
    borderRadius: 8,
    gap: 12,
    padding: 16,
  },
  allowedTitle: { color: '#17324D', fontSize: 20, fontWeight: '700' },
  link: { color: '#175CD3', fontSize: 16, fontWeight: '700', paddingVertical: 12 },
});
