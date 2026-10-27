import { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { getContainer } from '../../src/composition/container.js';
import { ReportPeriodType } from '../../src/domain/rules/reportingRules.js';
import {
  AccessibleButton,
  ApplicationState,
  NativeDateTimeField,
  SelectField,
} from '../../src/presentation/components/index.js';
import { useAuthSession } from '../../src/presentation/navigation/index.js';

const PERIOD_OPTIONS = Object.freeze([
  { label: 'Semanal', value: ReportPeriodType.WEEKLY },
  { label: 'Mensal', value: ReportPeriodType.MONTHLY },
  { label: 'Anual', value: ReportPeriodType.ANNUAL },
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
      setPeriodError('Informe uma data e hora final válidas para a exportação.');
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
            Exportar resumo do cuidado
          </Text>
          <Text style={styles.description}>
            Crie um arquivo JSON versionado localmente. O aplicativo não o transmite ao RNDS, ao
            e-SUS ou a qualquer serviço externo.
          </Text>
        </View>
        <SelectField
          accessibilityHint="Escolha o período do relatório incluído no arquivo JSON local"
          label="Período da exportação"
          onValueChange={setPeriodType}
          options={PERIOD_OPTIONS}
          value={periodType}
        />
        <NativeDateTimeField
          accessibilityHint="Escolha o fim inclusivo do período exportado"
          error={periodError}
          label="Fim do período da exportação"
          onValueChange={setPeriodEnd}
          testID="export-period-end"
          value={periodEnd}
        />
        <AccessibleButton
          accessibilityHint="Autoriza o relatório, salva um arquivo JSON local e abre o compartilhamento do aparelho quando disponível"
          accessibilityLabel="Exportar relatório selecionado"
          busy={status === 'loading'}
          onPress={submit}
          title="Exportar JSON"
        />
        {status === 'denied' ? (
          <ApplicationState
            message="O paciente não concedeu acesso ativo. Nenhum relatório ou arquivo de exportação foi criado."
            title="Acesso negado"
            variant="forbidden"
          />
        ) : null}
        {status === 'error' ? (
          <ApplicationState
            actionHint="Tenta novamente a exportação local autorizada"
            actionLabel="Tentar novamente"
            message="Não foi possível criar a exportação local. Nenhuma informação clínica foi transmitida."
            onAction={submit}
            title="Exportação indisponível"
            variant="error"
          />
        ) : null}
        {status === 'success' ? (
          <View accessibilityRole="summary" style={styles.success}>
            <Text accessibilityRole="header" style={styles.successTitle}>
              Exportação pronta
            </Text>
            <Text>
              {result.shared
                ? 'A tela de compartilhamento do aparelho foi aberta.'
                : 'O arquivo foi salvo localmente.'}
            </Text>
            <Text selectable>Arquivo local: {result.uri}</Text>
            <Text style={styles.notice}>
              Nenhuma transmissão externa foi iniciada pelo MySeizures.
            </Text>
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
        message="Escolha um relatório de paciente autorizado antes de exportar."
        title="Paciente inválido"
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
