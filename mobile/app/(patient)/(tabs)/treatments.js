import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useFocusEffect } from 'expo-router';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { getContainer } from '../../../src/composition/container.js';
import { AccessibleButton, FormFeedback } from '../../../src/presentation/components/index.js';
import { useAuthSession } from '../../../src/presentation/navigation/index.js';

export function TreatmentList({ listTreatments, refreshKey = 0 }) {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setStatus('loading');
    setError(null);

    try {
      setItems(await listTreatments.execute());
      setStatus('success');
    } catch {
      setItems([]);
      setError('Não foi possível carregar os tratamentos.');
      setStatus('error');
    }
  }, [listTreatments]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  return (
    <SafeAreaView style={styles.page}>
      <Text accessibilityRole="header" style={styles.title}>
        Tratamentos
      </Text>
      <Link href="/(patient)/treatments/new" accessibilityLabel="Adicionar tratamento">
        Adicionar tratamento
      </Link>
      {status === 'loading' ? (
        <Text accessibilityLiveRegion="polite">Carregando tratamentos…</Text>
      ) : null}
      {status === 'error' ? (
        <>
          <FormFeedback message={error} variant="error" />
          <AccessibleButton
            accessibilityLabel="Tentar carregar os tratamentos novamente"
            onPress={load}
            title="Tentar novamente"
            variant="secondary"
          />
        </>
      ) : null}
      {status === 'success' && items.length === 0 ? (
        <Text>Nenhum tratamento cadastrado.</Text>
      ) : null}
      {status === 'success'
        ? items.map((item) => (
            <View key={item.id} style={styles.card}>
              <Text style={styles.name}>{item.name}</Text>
              <Text>{item.baseTimes.join(', ')}</Text>
              <Link
                accessibilityLabel={`Editar ${item.name}`}
                href={{ pathname: '/(patient)/treatments/[id]', params: { id: item.id } }}
              >
                Editar tratamento
              </Link>
            </View>
          ))
        : null}
    </SafeAreaView>
  );
}

function Connected() {
  const { user } = useAuthSession();
  const id = user?.patientId ?? user?.id;
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

  return (
    <TreatmentList
      listTreatments={getContainer().treatmentForPatient(id).listTreatments}
      refreshKey={refreshKey}
    />
  );
}
export default function TreatmentsScreen(props) {
  return props?.listTreatments ? <TreatmentList {...props} /> : <Connected />;
}
const styles = StyleSheet.create({
  page: { flex: 1, gap: 16, padding: 24 },
  title: { color: '#17324D', fontSize: 28, fontWeight: '700' },
  card: { backgroundColor: '#FFF', gap: 4, padding: 16 },
  name: { fontSize: 17, fontWeight: '700' },
});
