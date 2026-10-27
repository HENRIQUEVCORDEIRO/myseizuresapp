import { useCallback, useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { getContainer } from '../../src/composition/container.js';
import { ConsumptionStatus } from '../../src/domain/value-objects/index.js';
import { AccessibleButton, FormFeedback } from '../../src/presentation/components/index.js';
import { formatDateTime, formatDateTimeLong } from '../../src/presentation/formatters/index.js';
import { useAuthSession } from '../../src/presentation/navigation/index.js';

export function ReminderList({ confirmDose, listReminders, selectedReminderId }) {
  const [items, setItems] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [status, setStatus] = useState('loading');

  const load = useCallback(async () => {
    setStatus('loading');

    try {
      const nextItems = await listReminders.execute();
      setItems(nextItems);
      setStatus('success');
    } catch {
      setItems([]);
      setStatus('error');
      setFeedback({
        variant: 'error',
        message: 'Não foi possível carregar as doses de medicação.',
      });
    }
  }, [listReminders]);

  useEffect(() => {
    void load();
  }, [load]);

  async function confirm(id, consumptionStatus) {
    try {
      await confirmDose.execute({ reminderId: id, consumptionStatus });
      setFeedback({ variant: 'success', message: 'Confirmação da dose salva.' });
      await load();
    } catch {
      setFeedback({
        variant: 'error',
        message: 'Não foi possível confirmar a dose.',
      });
    }
  }

  return (
    <SafeAreaView style={styles.page}>
      <Text accessibilityRole="header" style={styles.title}>
        Doses de medicação
      </Text>
      <FormFeedback {...feedback} />
      {status === 'loading' ? (
        <Text accessibilityLiveRegion="polite">Carregando doses de medicação…</Text>
      ) : null}
      {status === 'success' && items.length === 0 ? (
        <Text>Nenhuma dose precisa de confirmação.</Text>
      ) : null}
      {status === 'error' ? (
        <AccessibleButton
          accessibilityLabel="Tentar carregar as doses de medicação novamente"
          onPress={load}
          title="Tentar novamente"
          variant="secondary"
        />
      ) : null}
      {status === 'success'
        ? items.map((item) => (
            <View
              accessibilityLabel={`Lembrete ${item.id} em ${formatDateTimeLong(item.scheduledAt)}`}
              key={item.id}
              style={[styles.card, Number(selectedReminderId) === item.id && styles.selected]}
            >
              <Text style={styles.scheduledAt}>{formatDateTime(item.scheduledAt)}</Text>
              <View style={styles.actions}>
                <AccessibleButton
                  title="Tomei"
                  accessibilityLabel={`Marcar lembrete ${item.id} como tomado`}
                  onPress={() => confirm(item.id, ConsumptionStatus.TAKEN)}
                />
                <AccessibleButton
                  title="Não tomei"
                  accessibilityLabel={`Marcar lembrete ${item.id} como não tomado`}
                  onPress={() => confirm(item.id, ConsumptionStatus.MISSED)}
                />
              </View>
            </View>
          ))
        : null}
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
  scheduledAt: { color: '#17324D', fontSize: 17, fontWeight: '700' },
  selected: { borderColor: '#2563EB', borderWidth: 2 },
  actions: { flexDirection: 'row', gap: 12 },
});
