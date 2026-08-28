import { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { getContainer } from '../../src/composition/container.js';
import { ReportPeriodType } from '../../src/domain/rules/reportingRules.js';
import {
  AccessibleButton,
  ApplicationState,
  DateTimeField,
  SelectField,
} from '../../src/presentation/components/index.js';
import { useAuthSession } from '../../src/presentation/navigation/index.js';

const PERIOD_OPTIONS = Object.freeze([
  { label: 'Weekly', value: ReportPeriodType.WEEKLY },
  { label: 'Monthly', value: ReportPeriodType.MONTHLY },
  { label: 'Annual', value: ReportPeriodType.ANNUAL },
]);

export function ReportExportAction({
  exportReport,
  initialPeriodEnd = new Date().toISOString(),
  initialPeriodType = ReportPeriodType.WEEKLY,
  patientId,
}) {
  const [periodType, setPeriodType] = useState(initialPeriodType);
  const [periodEnd, setPeriodEnd] = useState(initialPeriodEnd);
  const [periodError, setPeriodError] = useState(null);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState('idle');

  async function submit() {
    if (!Number.isFinite(Date.parse(periodEnd))) {
      setPeriodError('Report end must be a valid ISO 8601 date and time.');
      return;
    }
    setPeriodError(null);
    setResult(null);
    setStatus('loading');
    try {
      const value = await exportReport.execute({ patientId, periodType, periodEnd, share: true });
      setResult(value);
      setStatus('success');
    } catch (error) {
      setStatus(error?.name === 'ReportAccessDeniedError' ? 'denied' : 'error');
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.heading}>
          <Text accessibilityRole="header" style={styles.title}>
            Export care summary
          </Text>
          <Text style={styles.description}>
            Create a versioned JSON file locally. The app does not transmit it to RNDS, e-SUS, or
            any external service.
          </Text>
        </View>
        <SelectField
          accessibilityHint="Choose the report period included in the local JSON file"
          label="Export period"
          onValueChange={setPeriodType}
          options={PERIOD_OPTIONS}
          value={periodType}
        />
        <DateTimeField
          accessibilityHint="Enter the inclusive end of the exported report period in UTC"
          error={periodError}
          label="Export period end"
          onChangeText={setPeriodEnd}
          value={periodEnd}
        />
        <AccessibleButton
          accessibilityHint="Authorizes the report, saves a local JSON file, and opens device sharing when available"
          accessibilityLabel="Export selected report"
          busy={status === 'loading'}
          onPress={submit}
          title="Export JSON"
        />
        {status === 'denied' ? (
          <ApplicationState
            message="The patient has not granted active access. No report or export file was created."
            title="Access denied"
            variant="forbidden"
          />
        ) : null}
        {status === 'error' ? (
          <ApplicationState
            actionHint="Attempts the authorized local export again"
            actionLabel="Try again"
            message="The local export could not be created. No clinical information was transmitted."
            onAction={submit}
            title="Export unavailable"
            variant="error"
          />
        ) : null}
        {status === 'success' ? (
          <View accessibilityRole="summary" style={styles.success}>
            <Text accessibilityRole="header" style={styles.successTitle}>
              Export ready
            </Text>
            <Text>
              {result.shared ? 'The device share sheet was opened.' : 'The file was saved locally.'}
            </Text>
            <Text selectable>Local file: {result.uri}</Text>
            <Text style={styles.notice}>No external transmission was initiated by MySeizures.</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function ConnectedReportExport() {
  const params = useLocalSearchParams();
  const { user } = useAuthSession();
  const parameterPatientId = Number(
    Array.isArray(params.patientId) ? params.patientId[0] : params.patientId,
  );
  const ownPatientId = user?.role === 'PATIENT' ? (user.patientId ?? user.id) : null;
  const patientId =
    Number.isInteger(parameterPatientId) && parameterPatientId > 0
      ? parameterPatientId
      : ownPatientId;

  if (!Number.isInteger(patientId) || patientId < 1) {
    return (
      <ApplicationState
        message="Choose an authorized patient report before exporting."
        title="Invalid patient"
        variant="error"
      />
    );
  }
  return (
    <ReportExportAction
      exportReport={getContainer().reportForPatient(patientId).exportReport}
      initialPeriodEnd={typeof params.periodEnd === 'string' ? params.periodEnd : undefined}
      initialPeriodType={typeof params.periodType === 'string' ? params.periodType : undefined}
      patientId={patientId}
    />
  );
}

export default function ReportExportScreen(props) {
  return props?.exportReport ? <ReportExportAction {...props} /> : <ConnectedReportExport />;
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#F8FAFC', flex: 1 },
  content: { flexGrow: 1, gap: 20, padding: 24 },
  heading: { gap: 8 },
  title: { color: '#17324D', fontSize: 28, fontWeight: '700' },
  description: { color: '#334155', fontSize: 16, lineHeight: 24 },
  success: {
    backgroundColor: '#ECFDF3',
    borderLeftColor: '#067647',
    borderLeftWidth: 4,
    borderRadius: 8,
    gap: 8,
    padding: 16,
  },
  successTitle: { color: '#17324D', fontSize: 20, fontWeight: '700' },
  notice: { color: '#334155', fontSize: 14, fontWeight: '600' },
});
