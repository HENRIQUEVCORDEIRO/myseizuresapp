import { useEffect, useState } from 'react';
import { Link } from 'expo-router';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { getContainer } from '../../../src/composition/container.js';
import { useAuthSession } from '../../../src/presentation/navigation/index.js';

export function TreatmentList({ listTreatments }) {
  const [items, setItems] = useState([]);
  useEffect(() => {
    listTreatments.execute().then(setItems);
  }, [listTreatments]);
  return (
    <SafeAreaView style={styles.page}>
      <Text accessibilityRole="header" style={styles.title}>
        Treatments
      </Text>
      <Link href="/(patient)/treatments/new" accessibilityLabel="Add treatment">
        Add treatment
      </Link>
      {items.length ? (
        items.map((item) => (
          <View key={item.id} style={styles.card}>
            <Text style={styles.name}>{item.name}</Text>
            <Text>{item.baseTimes.join(', ')}</Text>
            <Link
              accessibilityLabel={`Edit ${item.name}`}
              href={{ pathname: '/(patient)/treatments/[id]', params: { id: item.id } }}
            >
              Edit treatment
            </Link>
          </View>
        ))
      ) : (
        <Text>No treatments yet.</Text>
      )}
    </SafeAreaView>
  );
}
function Connected() {
  const { user } = useAuthSession();
  const id = user?.patientId ?? user?.id;
  return <TreatmentList listTreatments={getContainer().treatmentForPatient(id).listTreatments} />;
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
