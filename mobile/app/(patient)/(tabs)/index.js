import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { getContainer } from '../../../src/composition/container.js';
import { ReportPeriodType } from '../../../src/domain/rules/reportingRules.js';
import {
  Button,
  Card,
  Screen,
  SegmentedControl,
  StatTile,
  StatTileTones,
} from '../../../src/presentation/components/index.js';
import { useAuthSession } from '../../../src/presentation/navigation/index.js';
import { colors, spacing, typography } from '../../../src/presentation/theme/tokens.js';

const PERIOD_OPTIONS = Object.freeze([
  { label: 'Week', value: ReportPeriodType.WEEKLY },
  { label: 'Month', value: ReportPeriodType.MONTHLY },
  { label: 'Year', value: ReportPeriodType.ANNUAL },
]);

const PERIOD_TITLES = Object.freeze({
  [ReportPeriodType.WEEKLY]: 'Last 7 days',
  [ReportPeriodType.MONTHLY]: 'This month',
  [ReportPeriodType.ANNUAL]: 'This year',
});

const QUICK_ACTIONS = Object.freeze([
  {
    description: 'Add the date, time, and type of a seizure.',
    glyph: '⚡',
    href: '/(patient)/seizures/new',
    title: 'Record seizure',
  },
  {
    description: 'Add possible triggers, sleep quality, and mood.',
    glyph: '🌙',
    href: '/(patient)/triggers/new',
    title: 'Record trigger',
  },
  {
    description: 'Confirm the doses you have taken.',
    glyph: '💊',
    href: '/(patient)/reminders',
    title: 'Confirm dose',
  },
]);

const SHORTCUTS = Object.freeze([
  {
    description: 'Add or update your medications and schedules.',
    href: '/(patient)/treatments',
    title: 'Treatments',
  },
  {
    description: 'Choose which doctor or caregiver can review your care information.',
    href: '/(patient)/sharing',
    title: 'Professional access',
  },
]);

function adherenceTile(adherence) {
  if (!adherence || adherence.rate === undefined) {
    return {
      caption: 'No confirmed doses',
      tone: StatTileTones.neutral,
      value: '—',
    };
  }

  return {
    caption: `${adherence.takenDoses} of ${adherence.finalDoses} doses taken`,
    tone: adherence.rate >= 80 ? StatTileTones.success : StatTileTones.warning,
    value: `${Math.round(adherence.rate)}%`,
  };
}

export function PatientHome({
  generateReport,
  listReminders,
  onNavigate,
  onSwitchProfile,
  patientId,
  user,
}) {
  const [periodType, setPeriodType] = useState(ReportPeriodType.WEEKLY);
  const [summary, setSummary] = useState(null);
  const [pendingDoses, setPendingDoses] = useState(0);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setStatus('loading');
    setError(null);

    try {
      const [report, reminders] = await Promise.all([
        generateReport.execute({ patientId, periodType, periodEnd: new Date().toISOString() }),
        listReminders.execute(),
      ]);
      setSummary(report);
      setPendingDoses(reminders.length);
      setStatus('success');
    } catch (loadError) {
      setSummary(null);
      setError(loadError?.message || 'The care summary could not be loaded.');
      setStatus('error');
    }
  }, [generateReport, listReminders, patientId, periodType]);

  useEffect(() => {
    void load();
  }, [load]);

  const adherence = summary ? adherenceTile(summary.adherence) : null;

  return (
    <Screen subtitle={`Welcome, ${user?.name ?? ''}.`} title="Home">
      <View accessibilityLabel="Quick actions" accessibilityRole="list" style={styles.actions}>
        {QUICK_ACTIONS.map((action) => (
          <Card
            accessibilityHint={action.description}
            accessibilityLabel={action.title}
            icon={action.glyph}
            key={action.href}
            onPress={() => onNavigate(action.href)}
            title={action.title}
          >
            <Text style={styles.actionDescription}>{action.description}</Text>
            {action.href === '/(patient)/reminders' && pendingDoses > 0 ? (
              <Text accessibilityLabel={`${pendingDoses} doses to confirm`} style={styles.badge}>
                {pendingDoses}
              </Text>
            ) : null}
          </Card>
        ))}
      </View>

      <View style={styles.section}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          {PERIOD_TITLES[periodType]}
        </Text>
        <SegmentedControl
          accessibilityHint="Choose the period the summary covers"
          accessibilityLabel="Summary period"
          onValueChange={setPeriodType}
          options={PERIOD_OPTIONS}
          value={periodType}
        />
      </View>

      {status === 'loading' ? (
        <View accessibilityLiveRegion="polite" style={styles.loading}>
          <ActivityIndicator accessibilityLabel="Loading the care summary" size="large" />
          <Text style={styles.loadingText}>Loading your summary…</Text>
        </View>
      ) : null}

      {status === 'error' ? (
        <View style={styles.error}>
          <Text
            accessibilityLiveRegion="assertive"
            accessibilityRole="alert"
            style={styles.errorText}
          >
            {error} No clinical information was shared.
          </Text>
          <Button
            accessibilityLabel="Try loading the summary again"
            onPress={load}
            title="Try again"
            variant="secondary"
          />
        </View>
      ) : null}

      {status === 'success' && summary ? (
        <View style={styles.tiles}>
          <StatTile label="Seizures" value={String(summary.seizures.length)} />
          <StatTile label="Triggers" value={String(summary.triggers.length)} />
          <StatTile
            caption={adherence.caption}
            label="Adherence"
            tone={adherence.tone}
            value={adherence.value}
          />
        </View>
      ) : null}

      <View accessibilityLabel="Care shortcuts" accessibilityRole="list" style={styles.actions}>
        {SHORTCUTS.map((shortcut) => (
          <Card
            accessibilityHint={shortcut.description}
            accessibilityLabel={shortcut.title}
            key={shortcut.href}
            onPress={() => onNavigate(shortcut.href)}
            title={shortcut.title}
          >
            <Text style={styles.actionDescription}>{shortcut.description}</Text>
          </Card>
        ))}
      </View>

      <Button
        accessibilityHint="Clears this profile and returns to the sign-in screen"
        accessibilityLabel="Switch profile"
        onPress={onSwitchProfile}
        title="Switch profile"
        variant="secondary"
      />
    </Screen>
  );
}

export default function PatientHomeScreen(props) {
  const router = useRouter();
  const { signOut, user } = useAuthSession();
  const patientId = user?.patientId ?? user?.id;

  async function switchProfile() {
    try {
      await signOut();
    } catch {
      // A failed sign-out must still return the user to the sign-in screen, so the local session
      // is cleared by the session provider regardless of the failure.
    } finally {
      router.replace('/(auth)');
    }
  }

  if (props?.generateReport && props?.listReminders) {
    return <PatientHome {...props} />;
  }

  const container = getContainer();

  return (
    <PatientHome
      generateReport={container.reportForPatient(patientId).generateReport}
      listReminders={container.treatmentForPatient(patientId).listReminders}
      onNavigate={(href) => router.push(href)}
      onSwitchProfile={switchProfile}
      patientId={patientId}
      user={user}
    />
  );
}

const styles = StyleSheet.create({
  actions: { gap: spacing.md },
  actionDescription: { ...typography.caption, color: colors.textTertiary },
  badge: {
    ...typography.caption,
    alignSelf: 'flex-start',
    backgroundColor: colors.infoBackground,
    borderRadius: 999,
    color: colors.info,
    marginTop: spacing.xs,
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  section: { gap: spacing.md },
  sectionTitle: { ...typography.subtitle, color: colors.textPrimary },
  loading: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
  loadingText: { ...typography.caption, color: colors.textTertiary },
  error: {
    backgroundColor: colors.dangerBackground,
    borderRadius: 12,
    gap: spacing.md,
    padding: spacing.lg,
  },
  errorText: { ...typography.body, color: colors.danger },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
});
