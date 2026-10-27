import { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text } from 'react-native';
import { getContainer } from '../../../src/composition/container.js';
import { TreatmentType } from '../../../src/domain/value-objects/index.js';
import {
  AccessibleButton,
  FormFeedback,
  FormField,
  SelectField,
  TimeListField,
} from '../../../src/presentation/components/index.js';
import { useAuthSession } from '../../../src/presentation/navigation/index.js';

const TREATMENT_TYPE_LABELS = Object.freeze({
  [TreatmentType.MEDICATION]: 'Medicamento',
  [TreatmentType.THERAPY]: 'Terapia',
  [TreatmentType.OTHER]: 'Outro',
});

const TYPES = Object.entries(TreatmentType).map(([, value]) => ({
  label: TREATMENT_TYPE_LABELS[value],
  value,
}));

export function TreatmentForm({ manageTreatment, initialTreatment = null }) {
  const [name, setName] = useState(initialTreatment?.name ?? '');
  const [type, setType] = useState(initialTreatment?.type ?? TreatmentType.MEDICATION);
  const [times, setTimes] = useState(initialTreatment?.baseTimes ?? []);
  const [feedback, setFeedback] = useState(null);
  const [timeError, setTimeError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    const baseTimes = [...new Set(times)].sort();

    if (!name.trim()) {
      setFeedback({ variant: 'error', message: 'Informe o nome do tratamento.' });
      return;
    }

    if (baseTimes.length === 0) {
      setFeedback(null);
      setTimeError('Informe pelo menos um horário diário.');
      return;
    }

    setTimeError(null);
    setBusy(true);
    try {
      const result = await manageTreatment.execute({
        id: initialTreatment?.id,
        type,
        name: name.trim(),
        dailyFrequency: baseTimes.length,
        baseTimes,
        active: initialTreatment?.active ?? true,
      });
      setFeedback({
        variant: 'success',
        message: result.delivery.inApp.length
          ? 'Tratamento salvo. Os lembretes estão disponíveis no aplicativo.'
          : 'Tratamento e notificações salvos.',
      });
    } catch {
      setFeedback({
        variant: 'error',
        message: 'Não foi possível salvar o tratamento. Verifique os dados e tente novamente.',
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text accessibilityRole="header" style={styles.title}>
          {initialTreatment ? 'Editar tratamento' : 'Novo tratamento'}
        </Text>
        <FormField label="Nome do tratamento" value={name} onChangeText={setName} />
        <SelectField
          label="Tipo de tratamento"
          value={type}
          onValueChange={setType}
          options={TYPES}
        />
        <TimeListField
          accessibilityHint="Escolha os horários diários do tratamento no formato de 24 horas"
          error={timeError}
          label="Horários diários"
          onChange={setTimes}
          required
          value={times}
        />
        <FormFeedback {...feedback} />
        <AccessibleButton
          title="Salvar tratamento"
          accessibilityLabel="Salvar tratamento"
          busy={busy}
          onPress={submit}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function Connected() {
  const { user } = useAuthSession();
  const patientId = user?.patientId ?? user?.id;
  return (
    <TreatmentForm
      manageTreatment={getContainer().treatmentForPatient(patientId).manageTreatment}
    />
  );
}
export default function NewTreatmentScreen(props) {
  return props?.manageTreatment ? <TreatmentForm {...props} /> : <Connected />;
}
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { gap: 18, padding: 24 },
  title: { color: '#17324D', fontSize: 28, fontWeight: '700' },
});
