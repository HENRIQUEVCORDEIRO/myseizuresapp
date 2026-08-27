import { useCallback, useEffect, useRef, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ReportPeriodType } from '../../../domain/rules/reportingRules.js';
import {
  AccessibleButton,
  ApplicationState,
  DateTimeField,
  SelectField,
} from '../../components/index.js';
import { ClinicalAlertList } from './ClinicalAlertList.js';
import { ReportSummaryChart } from './ReportSummaryChart.js';

const PERIOD_OPTIONS = Object.freeze([
  { label: 'Weekly', value: ReportPeriodType.WEEKLY },
  { label: 'Monthly', value: ReportPeriodType.MONTHLY },
  { label: 'Annual', value: ReportPeriodType.ANNUAL },
]);

function adherenceText(adherence) {
  if (adherence.rate === undefined) return 'Not available: no final dose confirmations.';
  return `${adherence.rate.toFixed(1)}% (${adherence.takenDoses} of ${adherence.finalDoses} final doses taken)`;
}

export function ProfessionalReport({
  generateReport,
  initialPeriodEnd = new Date().toISOString(),
  initialPeriodType = ReportPeriodType.WEEKLY,
  loadOnMount = true,
  patientId,
}) {
  const initialSelection = useRef({ periodEnd: initialPeriodEnd, periodType: initialPeriodType });
  const [periodType, setPeriodType] = useState(initialSelection.current.periodType);
  const [periodEnd, setPeriodEnd] = useState(initialSelection.current.periodEnd);
  const [periodEndError, setPeriodEndError] = useState(null);
  const [report, setReport] = useState(null);
  const [status, setStatus] = useState('idle');

  const loadReport = useCallback(
    async (selection) => {
      setReport(null);
      setStatus('loading');
      try {
        const value = await generateReport.execute({ patientId, ...selection });
        setReport(value);
        setStatus('success');
      } catch (error) {
        setStatus(error?.name === 'ReportAccessDeniedError' ? 'denied' : 'error');
      }
    },
    [generateReport, patientId],
  );

  useEffect(() => {
    if (loadOnMount) void loadReport(initialSelection.current);
  }, [loadOnMount, loadReport]);

  function submit() {
    if (!Number.isFinite(Date.parse(periodEnd))) {
      setPeriodEndError('Report end must be a valid ISO 8601 date and time.');
      return;
    }
    setPeriodEndError(null);
    void loadReport({ periodType, periodEnd });
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.heading}>
          <Text accessibilityRole="header" style={styles.title}>
            Patient report
          </Text>
          <Text style={styles.description}>
            Review only information covered by the patient's current active access grant.
          </Text>
        </View>
        <SelectField
          accessibilityHint="Choose a weekly, monthly, or annual reporting period"
          label="Report period"
          onValueChange={setPeriodType}
          options={PERIOD_OPTIONS}
          value={periodType}
        />
        <DateTimeField
          accessibilityHint="Enter the inclusive end of the report period in UTC"
          error={periodEndError}
          label="Report period end"
          onChangeText={setPeriodEnd}
          value={periodEnd}
        />
        <AccessibleButton
          accessibilityHint="Rechecks active access and loads the selected report period"
          accessibilityLabel="View selected report"
          busy={status === 'loading'}
          onPress={submit}
          title="View report"
        />

        {status === 'loading' ? (
          <ApplicationState
            message="Authorization and report data are being checked."
            title="Loading report"
            variant="loading"
          />
        ) : null}
        {status === 'denied' ? (
          <ApplicationState
            message="The patient has not granted active access. Report data, alerts, and clinical details are unavailable."
            title="Access denied"
            variant="forbidden"
          />
        ) : null}
        {status === 'error' ? (
          <ApplicationState
            actionHint="Attempts to authorize and load the selected report again"
            actionLabel="Try again"
            message="The report could not be loaded. No clinical information is displayed."
            onAction={() => loadReport({ periodType, periodEnd })}
            title="Report unavailable"
            variant="error"
          />
        ) : null}
        {status === 'idle' ? (
          <Text style={styles.prompt}>Select a period to view the report.</Text>
        ) : null}

        {status === 'success' && report?.empty ? (
          <ApplicationState
            message="There are no seizure, trigger, or final adherence records in the selected period. No adherence rate or risk is inferred from missing data."
            title="No records in this period"
          />
        ) : null}
        {status === 'success' && report && !report.empty ? (
          <View accessibilityLabel="Authorized selected-period report" style={styles.report}>
            <View accessibilityRole="summary" style={styles.summary}>
              <Text accessibilityRole="header" style={styles.sectionTitle}>
                Selected-period summary
              </Text>
              <Text>From {report.period.periodStart}</Text>
              <Text>Through {report.period.periodEnd}</Text>
              <Text>Seizures: {report.seizures.length}</Text>
              <Text>Possible triggers: {report.triggers.length}</Text>
              <Text>Global adherence: {adherenceText(report.adherence)}</Text>
            </View>
            <ReportSummaryChart report={report} />
            <View style={styles.summary}>
              <Text accessibilityRole="header" style={styles.sectionTitle}>
                Trigger trends
              </Text>
              {report.triggerTrends.length ? (
                report.triggerTrends.map((trend) => (
                  <Text key={trend.cause}>
                    {trend.cause}: {trend.count}
                  </Text>
                ))
              ) : (
                <Text>No trigger trends in this period.</Text>
              )}
            </View>
            <ClinicalAlertList alerts={report.alerts} />
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#F8FAFC', flex: 1 },
  content: { flexGrow: 1, gap: 20, padding: 24 },
  heading: { gap: 8 },
  title: { color: '#17324D', fontSize: 28, fontWeight: '700' },
  description: { color: '#334155', fontSize: 16, lineHeight: 24 },
  prompt: { color: '#475467', fontSize: 15, textAlign: 'center' },
  report: { gap: 18 },
  summary: { backgroundColor: '#FFFFFF', borderRadius: 8, gap: 6, padding: 16 },
  sectionTitle: { color: '#17324D', fontSize: 20, fontWeight: '700' },
});
