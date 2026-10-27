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
      setFieldError('Informe um identificador positivo de paciente.');
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
            Acesso do paciente
          </Text>
          <Text style={styles.description}>
            Informe o identificador de um paciente para verificar um compartilhamento ativo.
          </Text>
        </View>
        <FormField
          accessibilityHint="Informe o identificador numérico compartilhado pelo paciente"
          error={fieldError}
          keyboardType="number-pad"
          label="Identificador do paciente"
          onChangeText={setPatientIdInput}
          value={patientIdInput}
        />
        <AccessibleButton
          accessibilityHint="Verifica se este paciente concede acesso a você no momento"
          accessibilityLabel="Verificar acesso do paciente"
          busy={status === 'checking'}
          onPress={checkAccess}
          title="Verificar acesso"
        />

        {status === 'allowed' ? (
          <View accessibilityRole="summary" style={styles.allowedCard}>
            <Text accessibilityRole="header" style={styles.allowedTitle}>
              Acesso ativo confirmado
            </Text>
            <Text style={styles.description}>
              Você pode revisar o relatório do período selecionado do paciente {patientId}.
            </Text>
            <Link
              accessibilityHint="Abre o relatório clínico autorizado do período selecionado"
              accessibilityLabel={`Abrir relatório do paciente ${patientId}`}
              href={{ pathname: '/(professional)/reports/[patientId]', params: { patientId } }}
              style={styles.link}
            >
              Abrir relatório
            </Link>
          </View>
        ) : null}
        {status === 'denied' ? (
          <ApplicationState
            message="Este paciente não concedeu acesso ativo a você. Nenhuma informação clínica está disponível."
            title="Acesso negado"
            variant="forbidden"
          />
        ) : null}
        {status === 'error' ? (
          <ApplicationState
            message="Não foi possível verificar o acesso. Nenhuma informação clínica está disponível."
            title="Verificação de acesso indisponível"
            variant="error"
          />
        ) : null}
        {status === 'idle' ? (
          <Text accessibilityLiveRegion="polite" style={styles.prompt}>
            Nenhum paciente selecionado.
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
