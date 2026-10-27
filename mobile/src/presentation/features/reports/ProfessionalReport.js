import { useCallback, useEffect, useRef, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ReportPeriodType } from '../../../domain/rules/reportingRules.js';
import {
  AccessibleButton,
  ApplicationState,
  NativeDateTimeField,
  SelectField,
} from '../../components/index.js';
import { formatDateTime } from '../../formatters/index.js';
import { labelFor, TRIGGER_CAUSE_LABELS } from '../../labels.js';
import { ClinicalAlertList } from './ClinicalAlertList.js';
import { ReportSummaryChart } from './ReportSummaryChart.js';

const PERIOD_OPTIONS = Object.freeze([
  { label: 'Semanal', value: ReportPeriodType.WEEKLY },
  { label: 'Mensal', value: ReportPeriodType.MONTHLY },
  { label: 'Anual', value: ReportPeriodType.ANNUAL },
]);

function adherenceText(adherence) {
  if (adherence.rate === undefined) return 'Não disponível: sem confirmações finais de doses.';
  return `${adherence.rate.toFixed(1)}% (${adherence.takenDoses} de ${adherence.finalDoses} doses finais tomadas)`;
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
      setPeriodEndError('Informe uma data e hora final válidas para o relatório.');
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
            Relatório do paciente
          </Text>
          <Text style={styles.description}>
            Revise apenas as informações cobertas pela autorização de acesso ativa do paciente.
          </Text>
        </View>
        <SelectField
          accessibilityHint="Escolha um período semanal, mensal ou anual"
          label="Período do relatório"
          onValueChange={setPeriodType}
          options={PERIOD_OPTIONS}
          value={periodType}
        />
        <NativeDateTimeField
          accessibilityHint="Escolha o fim inclusivo do período do relatório"
          error={periodEndError}
          label="Fim do período do relatório"
          onValueChange={setPeriodEnd}
          testID="report-period-end"
          value={periodEnd}
        />
        <AccessibleButton
          accessibilityHint="Verifica novamente o acesso ativo e carrega o período selecionado"
          accessibilityLabel="Ver relatório selecionado"
          busy={status === 'loading'}
          onPress={submit}
          title="Ver relatório"
        />

        {status === 'loading' ? (
          <ApplicationState
            message="A autorização e os dados do relatório estão sendo verificados."
            title="Carregando relatório"
            variant="loading"
          />
        ) : null}
        {status === 'denied' ? (
          <ApplicationState
            message="O paciente não concedeu acesso ativo. Dados do relatório, alertas e detalhes clínicos não estão disponíveis."
            title="Acesso negado"
            variant="forbidden"
          />
        ) : null}
        {status === 'error' ? (
          <ApplicationState
            actionHint="Tenta autorizar e carregar novamente o relatório selecionado"
            actionLabel="Tentar novamente"
            message="Não foi possível carregar o relatório. Nenhuma informação clínica é exibida."
            onAction={() => loadReport({ periodType, periodEnd })}
            title="Relatório indisponível"
            variant="error"
          />
        ) : null}
        {status === 'idle' ? (
          <Text style={styles.prompt}>Selecione um período para ver o relatório.</Text>
        ) : null}

        {status === 'success' && report?.empty ? (
          <ApplicationState
            message="Não há crises, gatilhos ou confirmações finais de doses no período selecionado. Nenhuma taxa de adesão ou risco é inferida pela ausência de dados."
            title="Nenhum registro neste período"
          />
        ) : null}
        {status === 'success' && report && !report.empty ? (
          <View
            accessibilityLabel="Relatório autorizado do período selecionado"
            style={styles.report}
          >
            <View accessibilityRole="summary" style={styles.summary}>
              <Text accessibilityRole="header" style={styles.sectionTitle}>
                Resumo do período selecionado
              </Text>
              <Text>De {formatDateTime(report.period.periodStart)}</Text>
              <Text>Até {formatDateTime(report.period.periodEnd)}</Text>
              <Text>Crises: {report.seizures.length}</Text>
              <Text>Possíveis gatilhos: {report.triggers.length}</Text>
              <Text>Adesão global: {adherenceText(report.adherence)}</Text>
            </View>
            <ReportSummaryChart report={report} />
            <View style={styles.summary}>
              <Text accessibilityRole="header" style={styles.sectionTitle}>
                Tendências de gatilhos
              </Text>
              {report.triggerTrends.length ? (
                report.triggerTrends.map((trend) => (
                  <Text key={trend.cause}>
                    {labelFor(TRIGGER_CAUSE_LABELS, trend.cause)}: {trend.count}
                  </Text>
                ))
              ) : (
                <Text>Nenhuma tendência de gatilho neste período.</Text>
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
