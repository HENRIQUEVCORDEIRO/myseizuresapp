import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
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
  { label: 'Semana', value: ReportPeriodType.WEEKLY },
  { label: 'Mês', value: ReportPeriodType.MONTHLY },
  { label: 'Ano', value: ReportPeriodType.ANNUAL },
]);

const PERIOD_TITLES = Object.freeze({
  [ReportPeriodType.WEEKLY]: 'Últimos 7 dias',
  [ReportPeriodType.MONTHLY]: 'Este mês',
  [ReportPeriodType.ANNUAL]: 'Este ano',
});

const QUICK_ACTIONS = Object.freeze([
  {
    description: 'Adicione a data, a hora e o tipo de uma crise.',
    glyph: '⚡',
    href: '/(patient)/seizures/new',
    title: 'Registrar crise',
  },
  {
    description: 'Adicione possíveis gatilhos, qualidade do sono e humor.',
    glyph: '🌙',
    href: '/(patient)/triggers/new',
    title: 'Registrar gatilho',
  },
  {
    description: 'Confirme as doses que você tomou.',
    glyph: '💊',
    href: '/(patient)/reminders',
    title: 'Confirmar dose',
  },
]);

const SHORTCUTS = Object.freeze([
  {
    description: 'Adicione ou atualize seus medicamentos e horários.',
    href: '/(patient)/treatments',
    title: 'Tratamentos',
  },
  {
    description: 'Escolha qual médico ou cuidador pode revisar suas informações de cuidado.',
    href: '/(patient)/sharing',
    title: 'Acesso do profissional',
  },
]);

function adherenceTile(adherence) {
  if (!adherence || adherence.rate === undefined) {
    return {
      caption: 'Nenhuma dose confirmada',
      tone: StatTileTones.neutral,
      value: '—',
    };
  }

  return {
    caption: `${adherence.takenDoses} de ${adherence.finalDoses} doses tomadas`,
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
  refreshKey = 0,
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
    } catch {
      setSummary(null);
      setError('Não foi possível carregar o resumo do cuidado.');
      setStatus('error');
    }
  }, [generateReport, listReminders, patientId, periodType, refreshKey]);

  useEffect(() => {
    void load();
  }, [load]);

  const adherence = summary ? adherenceTile(summary.adherence) : null;

  return (
    <Screen subtitle={`Bem-vindo(a), ${user?.name ?? ''}.`} title="Início">
      <View accessibilityLabel="Ações rápidas" accessibilityRole="list" style={styles.actions}>
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
              <Text
                accessibilityLabel={`${pendingDoses} doses para confirmar`}
                style={styles.badge}
              >
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
          accessibilityHint="Escolha o período coberto pelo resumo"
          accessibilityLabel="Período do resumo"
          onValueChange={setPeriodType}
          options={PERIOD_OPTIONS}
          value={periodType}
        />
      </View>

      {status === 'loading' ? (
        <View accessibilityLiveRegion="polite" style={styles.loading}>
          <ActivityIndicator accessibilityLabel="Carregando o resumo do cuidado" size="large" />
          <Text style={styles.loadingText}>Carregando seu resumo…</Text>
        </View>
      ) : null}

      {status === 'error' ? (
        <View style={styles.error}>
          <Text
            accessibilityLiveRegion="assertive"
            accessibilityRole="alert"
            style={styles.errorText}
          >
            {error} Nenhuma informação clínica foi exibida.
          </Text>
          <Button
            accessibilityLabel="Tentar carregar o resumo novamente"
            onPress={load}
            title="Tentar novamente"
            variant="secondary"
          />
        </View>
      ) : null}

      {status === 'success' && summary ? (
        <View style={styles.tiles}>
          <StatTile label="Crises" value={String(summary.seizures.length)} />
          <StatTile label="Gatilhos" value={String(summary.triggers.length)} />
          <StatTile
            caption={adherence.caption}
            label="Adesão"
            tone={adherence.tone}
            value={adherence.value}
          />
        </View>
      ) : null}

      <View accessibilityLabel="Atalhos de cuidado" accessibilityRole="list" style={styles.actions}>
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
        accessibilityHint="Limpa este perfil e retorna à tela de entrada"
        accessibilityLabel="Trocar perfil"
        onPress={onSwitchProfile}
        title="Trocar perfil"
        variant="secondary"
      />
    </Screen>
  );
}

export default function PatientHomeScreen(props) {
  const router = useRouter();
  const { signOut, user } = useAuthSession();
  const patientId = user?.patientId ?? user?.id;
  const [refreshKey, setRefreshKey] = useState(0);
  const firstFocus = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return undefined;
      }

      setRefreshKey((current) => current + 1);
      return undefined;
    }, []),
  );

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
      refreshKey={refreshKey}
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
