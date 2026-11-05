import { useCallback, useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { getContainer } from '../../../src/composition/container.js';
import {
  AccessibleButton,
  ApplicationState,
  FormFeedback,
  FormField,
} from '../../../src/presentation/components/index.js';
import { formatDateTime } from '../../../src/presentation/formatters/index.js';
import { useAuthSession } from '../../../src/presentation/navigation/index.js';

function activeGrants(grants) {
  return grants.filter((grant) => grant.revokedAt === null);
}

export function SharingManagement({ grantAccess, listAccessGrants, revokeAccess }) {
  const [grants, setGrants] = useState([]);
  const [professionalId, setProfessionalId] = useState('');
  const [fieldError, setFieldError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [status, setStatus] = useState('loading');
  const [busyGrantId, setBusyGrantId] = useState(null);

  const loadGrants = useCallback(async () => {
    setStatus('loading');
    setFeedback(null);
    try {
      const result = await listAccessGrants.execute();
      if (!result.ok) {
        setGrants([]);
        setFeedback({ message: 'Não foi possível carregar os acessos.', variant: 'error' });
        setStatus('error');
        return;
      }

      setGrants(activeGrants(result.value));
      setStatus('success');
    } catch {
      setGrants([]);
      setFeedback({
        message: 'Não foi possível concluir a solicitação de compartilhamento.',
        variant: 'error',
      });
      setStatus('error');
    }
  }, [listAccessGrants]);

  useEffect(() => {
    void loadGrants();
  }, [loadGrants]);

  async function createGrant() {
    const medicCaretakerId = Number(professionalId);
    if (!Number.isInteger(medicCaretakerId) || medicCaretakerId < 1) {
      setFieldError('Informe um identificador positivo de profissional.');
      return;
    }

    setFieldError(null);
    setFeedback(null);
    setStatus('granting');
    try {
      const result = await grantAccess.execute({ medicCaretakerId });
      if (!result.ok) {
        setFeedback({ message: 'Não foi possível conceder o acesso.', variant: 'error' });
        return;
      }

      setProfessionalId('');
      setGrants((current) => [...current, result.value]);
      setFeedback({ message: 'Acesso concedido.', variant: 'success' });
    } catch {
      setFeedback({
        message: 'Não foi possível concluir a solicitação de compartilhamento.',
        variant: 'error',
      });
    } finally {
      setStatus('success');
    }
  }

  async function revoke(grantId) {
    setBusyGrantId(grantId);
    setFeedback(null);
    try {
      const result = await revokeAccess.execute({ grantId });
      if (!result.ok) {
        setFeedback({ message: 'Não foi possível revogar o acesso.', variant: 'error' });
        return;
      }

      setGrants((current) => current.filter((grant) => grant.id !== grantId));
      setFeedback({ message: 'Acesso revogado.', variant: 'success' });
    } catch {
      setFeedback({
        message: 'Não foi possível concluir a solicitação de compartilhamento.',
        variant: 'error',
      });
    } finally {
      setBusyGrantId(null);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.heading}>
          <Text accessibilityRole="header" style={styles.title}>
            Gerenciar compartilhamento
          </Text>
          <Text style={styles.description}>
            Você controla qual médico ou cuidador pode revisar suas informações de cuidado.
          </Text>
        </View>

        <FormField
          accessibilityHint="Informe o identificador numérico fornecido ao médico ou cuidador"
          error={fieldError}
          keyboardType="number-pad"
          label="Identificador do profissional"
          onChangeText={setProfessionalId}
          value={professionalId}
        />
        <AccessibleButton
          accessibilityHint="Cria um relacionamento de compartilhamento ativo"
          accessibilityLabel="Conceder acesso ao profissional"
          busy={status === 'granting'}
          onPress={createGrant}
          title="Conceder acesso"
        />
        <FormFeedback message={feedback?.message} variant={feedback?.variant} />

        <Text accessibilityRole="header" style={styles.sectionTitle}>
          Acesso ativo
        </Text>
        {status === 'loading' ? (
          <ApplicationState
            message="Verificando seus compartilhamentos."
            title="Carregando acessos"
            variant="loading"
          />
        ) : null}
        {status === 'error' ? (
          <ApplicationState
            actionHint="Tenta carregar novamente os compartilhamentos ativos"
            actionLabel="Tentar novamente"
            message="Não foi possível carregar os acessos ativos. Nenhuma informação clínica foi compartilhada."
            onAction={loadGrants}
            title="Compartilhamento indisponível"
            variant="error"
          />
        ) : null}
        {status === 'success' && grants.length === 0 ? (
          <ApplicationState
            message="Nenhum médico ou cuidador tem acesso no momento."
            title="Nenhum acesso ativo"
          />
        ) : null}
        {status === 'success' && grants.length > 0 ? (
          <View
            accessibilityLabel="Profissionais com acesso ativo"
            accessibilityRole="list"
            style={styles.list}
          >
            {grants.map((grant) => (
              <View
                accessibilityLabel={`Profissional ${grant.medicCaretakerId} tem acesso ativo`}
                accessibilityRole="text"
                key={grant.id}
                style={styles.card}
              >
                <View style={styles.cardCopy}>
                  <Text style={styles.cardTitle}>Profissional {grant.medicCaretakerId}</Text>
                  <Text style={styles.activeStatus}>Acesso ativo</Text>
                  <Text style={styles.metadata}>
                    Concedido em {formatDateTime(grant.grantedAt)}
                  </Text>
                </View>
                <AccessibleButton
                  accessibilityHint={`Remove o acesso do profissional ${grant.medicCaretakerId}`}
                  accessibilityLabel={`Revogar acesso do profissional ${grant.medicCaretakerId}`}
                  busy={busyGrantId === grant.id}
                  disabled={busyGrantId !== null && busyGrantId !== grant.id}
                  onPress={() => revoke(grant.id)}
                  title="Revogar acesso"
                  variant="secondary"
                />
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function ConnectedSharingScreen() {
  const { user } = useAuthSession();
  const patientId = user?.patientId ?? user?.id;
  return <SharingManagement {...getContainer().accessForPatient(patientId)} />;
}

export default function SharingScreen(props) {
  return props?.listAccessGrants ? <SharingManagement {...props} /> : <ConnectedSharingScreen />;
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#F8FAFC', flex: 1 },
  content: { flexGrow: 1, gap: 18, padding: 24 },
  heading: { gap: 8 },
  title: { color: '#17324D', fontSize: 28, fontWeight: '700' },
  description: { color: '#334155', fontSize: 16, lineHeight: 24 },
  sectionTitle: { color: '#17324D', fontSize: 21, fontWeight: '700', marginTop: 8 },
  list: { gap: 12 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 8, gap: 16, padding: 16 },
  cardCopy: { gap: 4 },
  cardTitle: { color: '#17324D', fontSize: 17, fontWeight: '700' },
  activeStatus: { color: '#067647', fontSize: 15, fontWeight: '700' },
  metadata: { color: '#475467', fontSize: 14 },
});
