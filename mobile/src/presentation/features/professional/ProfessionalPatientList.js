import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ApplicationState, Button, Card, Screen } from '../../components/index.js';
import { formatDateTime } from '../../formatters/index.js';
import { colors, spacing, typography } from '../../theme/tokens.js';

function activeGrants(grants) {
  return grants.filter((grant) => grant.revokedAt === null);
}

export function ProfessionalPatientList({
  listAuthorizedPatients,
  onOpenPatient,
  onSignOut,
  refreshSignal = 0,
}) {
  const [grants, setGrants] = useState([]);
  const [status, setStatus] = useState('loading');

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const result = await listAuthorizedPatients.execute();
      if (!result.ok) {
        setGrants([]);
        setStatus('error');
        return;
      }

      setGrants(activeGrants(result.value));
      setStatus('success');
    } catch {
      setGrants([]);
      setStatus('error');
    }
  }, [listAuthorizedPatients]);

  useEffect(() => {
    void load();
  }, [load, refreshSignal]);

  return (
    <Screen
      subtitle="Pacientes que autorizaram você a revisar o relatório clínico."
      title="Área do profissional"
    >
      {status === 'loading' ? (
        <ApplicationState
          message="Verificando os compartilhamentos ativos."
          title="Carregando pacientes"
          variant="loading"
        />
      ) : null}

      {status === 'error' ? (
        <ApplicationState
          actionHint="Tenta carregar novamente os pacientes autorizados"
          actionLabel="Tentar novamente"
          message="Não foi possível carregar os pacientes autorizados. Nenhuma informação clínica é exibida."
          onAction={load}
          title="Pacientes indisponíveis"
          variant="error"
        />
      ) : null}

      {status === 'success' && grants.length === 0 ? (
        <ApplicationState
          message="Peça ao paciente para conceder acesso em Compartilhamento."
          title="Nenhum paciente compartilhou dados"
        />
      ) : null}

      {status === 'success' && grants.length > 0 ? (
        <View
          accessibilityLabel="Pacientes com acesso"
          accessibilityRole="list"
          style={styles.list}
        >
          {grants.map((grant) => (
            <Card
              accessibilityHint="Abre o relatório semanal autorizado deste paciente"
              accessibilityLabel={`Abrir relatório do paciente ${grant.patientId}`}
              icon="👤"
              key={grant.id}
              onPress={() => onOpenPatient(grant.patientId)}
              title={`Paciente ${grant.patientId}`}
            >
              <Text style={styles.activeStatus}>Acesso ativo</Text>
              <Text style={styles.metadata}>Concedido em {formatDateTime(grant.grantedAt)}</Text>
            </Card>
          ))}
        </View>
      ) : null}

      {status === 'success' ? (
        <Button
          accessibilityHint="Verifica novamente os pacientes que concederam acesso"
          onPress={load}
          title="Atualizar"
          variant="secondary"
        />
      ) : null}

      <Button
        accessibilityHint="Encerra sua sessão e retorna à tela de entrada"
        onPress={onSignOut}
        title="Sair"
        variant="secondary"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md },
  activeStatus: { ...typography.caption, color: colors.success },
  metadata: { ...typography.micro, color: colors.textTertiary },
});
