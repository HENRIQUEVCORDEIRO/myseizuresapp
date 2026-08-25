import { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { getContainer } from '../../src/composition/container.js';
import { ConsumptionStatus } from '../../src/domain/value-objects/index.js';
import { AccessibleButton, FormFeedback } from '../../src/presentation/components/index.js';
import { useAuthSession } from '../../src/presentation/navigation/index.js';

export function ReminderList({ confirmDose, listReminders, selectedReminderId }) {
  const [items, setItems] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const load = () => listReminders.execute().then(setItems);
  useEffect(load, [listReminders]);
  async function confirm(id, status) {
    try {
      await confirmDose.execute({ reminderId: id, consumptionStatus: status });
      setFeedback({ variant: 'success', message: 'Dose confirmation saved.' });
      await load();
    } catch (error) {
      setFeedback({ variant: 'error', message: error?.message ?? 'Dose could not be confirmed.' });
    }
  }
  return (
    <SafeAreaView style={styles.page}>
      <Text accessibilityRole="header" style={styles.title}>
        Medication reminders
      </Text>
      <FormFeedback {...feedback} />
      {items.length ? (
        items.map((item) => (
          <View
            accessibilityLabel={`Reminder ${item.id}`}
            key={item.id}
            style={[styles.card, Number(selectedReminderId) === item.id && styles.selected]}
          >
            <Text>{new Date(item.scheduledAt).toLocaleString()}</Text>
            <View style={styles.actions}>
              <AccessibleButton
                title="Taken"
                accessibilityLabel={`Mark reminder ${item.id} taken`}
                onPress={() => confirm(item.id, ConsumptionStatus.TAKEN)}
              />
              <AccessibleButton
                title="Missed"
                accessibilityLabel={`Mark reminder ${item.id} missed`}
                onPress={() => confirm(item.id, ConsumptionStatus.MISSED)}
              />
            </View>
          </View>
        ))
      ) : (
        <Text>No doses need confirmation.</Text>
      )}
    </SafeAreaView>
  );
}
function Connected() {
  const { reminderId } = useLocalSearchParams();
  const { user } = useAuthSession();
  const id = user?.patientId ?? user?.id;
  return (
    <ReminderList {...getContainer().treatmentForPatient(id)} selectedReminderId={reminderId} />
  );
}
export default function RemindersScreen(props) {
  return props?.listReminders ? <ReminderList {...props} /> : <Connected />;
}
const styles = StyleSheet.create({
  page: { flex: 1, gap: 16, padding: 24 },
  title: { color: '#17324D', fontSize: 28, fontWeight: '700' },
  card: { backgroundColor: '#FFF', gap: 12, padding: 16 },
  selected: { borderColor: '#2563EB', borderWidth: 2 },
  actions: { flexDirection: 'row', gap: 12 },
});
