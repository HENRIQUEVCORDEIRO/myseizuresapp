import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AccessibleButton, FormFeedback, NativeDateTimeField } from '../../components/index.js';
import { ClinicalEventItem } from './ClinicalEventItem.js';

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

function defaultPeriod() {
  const periodEnd = new Date();
  const periodStart = new Date(periodEnd.getTime() - 7 * DAY_IN_MILLISECONDS);

  return { periodStart: periodStart.toISOString(), periodEnd: periodEnd.toISOString() };
}

function requirePeriod(periodStartValue, periodEndValue) {
  const periodStart = String(periodStartValue ?? '').trim();
  const periodEnd = String(periodEndValue ?? '').trim();
  const errors = {};

  if (!periodStart) errors.periodStart = 'A data e hora inicial são obrigatórias.';
  if (!periodEnd) errors.periodEnd = 'A data e hora final são obrigatórias.';

  if (periodStart && !Number.isFinite(Date.parse(periodStart))) {
    errors.periodStart = 'Informe uma data e hora inicial válidas.';
  }

  if (periodEnd && !Number.isFinite(Date.parse(periodEnd))) {
    errors.periodEnd = 'Informe uma data e hora final válidas.';
  }

  if (!errors.periodStart && !errors.periodEnd && Date.parse(periodStart) > Date.parse(periodEnd)) {
    errors.periodEnd = 'A data e hora final devem ser iguais ou posteriores ao início.';
  }

  return { errors, period: { periodStart, periodEnd } };
}

export function CalendarHistory({
  initialPeriod,
  listChronologicalEvents,
  loadOnMount = true,
  patientId,
  refreshKey = 0,
}) {
  const initialPeriodRef = useRef(initialPeriod ?? (loadOnMount ? defaultPeriod() : {}));
  const [periodStart, setPeriodStart] = useState(initialPeriodRef.current.periodStart ?? '');
  const [periodEnd, setPeriodEnd] = useState(initialPeriodRef.current.periodEnd ?? '');
  const currentPeriodRef = useRef({ periodEnd, periodStart });
  const [errors, setErrors] = useState({});
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState('idle');
  const [loadError, setLoadError] = useState(null);
  currentPeriodRef.current = { periodEnd, periodStart };

  const loadPeriod = useCallback(
    async (period) => {
      setStatus('loading');
      setLoadError(null);

      try {
        const result = await listChronologicalEvents.execute({ patientId, ...period });
        setEvents(result);
        setStatus('success');
      } catch {
        setEvents([]);
        setLoadError('Não foi possível carregar o histórico local.');
        setStatus('error');
      }
    },
    [listChronologicalEvents, patientId],
  );

  useEffect(() => {
    if (!loadOnMount) {
      return;
    }

    const period = refreshKey === 0 ? initialPeriodRef.current : currentPeriodRef.current;
    void loadPeriod(period);
  }, [loadOnMount, loadPeriod, refreshKey]);

  function submit() {
    const validation = requirePeriod(periodStart, periodEnd);
    setErrors(validation.errors);

    if (Object.keys(validation.errors).length === 0) {
      void loadPeriod(validation.period);
    }
  }

  return (
    <View style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.heading}>
          <Text accessibilityRole="header" style={styles.title}>
            Calendário e histórico
          </Text>
          <Text style={styles.description}>
            Escolha um período inclusivo para revisar crises e possíveis gatilhos salvos neste
            aparelho.
          </Text>
        </View>
        <NativeDateTimeField
          accessibilityHint="Escolha o início do período do histórico"
          error={errors.periodStart}
          label="Início do período"
          onValueChange={setPeriodStart}
          required
          testID="period-start"
          value={periodStart}
        />
        <NativeDateTimeField
          accessibilityHint="Escolha o fim do período do histórico"
          error={errors.periodEnd}
          label="Fim do período"
          onValueChange={setPeriodEnd}
          required
          testID="period-end"
          value={periodEnd}
        />
        <AccessibleButton
          accessibilityHint="Carrega os eventos salvos localmente no período inclusivo selecionado"
          accessibilityLabel="Ver histórico"
          busy={status === 'loading'}
          onPress={submit}
          title="Ver histórico"
        />

        {status === 'loading' ? (
          <View accessibilityLiveRegion="polite" style={styles.state}>
            <ActivityIndicator accessibilityLabel="Carregando histórico clínico" size="large" />
            <Text style={styles.stateText}>Carregando histórico…</Text>
          </View>
        ) : null}

        {status === 'error' ? (
          <View style={styles.state}>
            <FormFeedback message={loadError} variant="error" />
            <AccessibleButton
              accessibilityHint="Tenta carregar novamente o período selecionado"
              accessibilityLabel="Tentar novamente"
              onPress={() => loadPeriod({ periodStart, periodEnd })}
              title="Tentar novamente"
              variant="secondary"
            />
          </View>
        ) : null}

        {status === 'success' && events.length === 0 ? (
          <View accessibilityRole="summary" style={styles.state}>
            <Text accessibilityRole="header" style={styles.emptyTitle}>
              Nenhum evento neste período.
            </Text>
            <Text style={styles.stateText}>
              Tente um período maior ou registre um novo evento clínico.
            </Text>
          </View>
        ) : null}

        {status === 'success' && events.length > 0 ? (
          <View
            accessibilityLabel="Eventos clínicos em ordem cronológica"
            accessibilityRole="list"
            style={styles.list}
          >
            {events.map((event) => (
              <ClinicalEventItem
                event={event}
                key={`${event.eventType}-${event.record.id ?? event.occurredAt}`}
              />
            ))}
          </View>
        ) : null}

        {status === 'idle' ? (
          <Text accessibilityLiveRegion="polite" style={styles.stateText}>
            Selecione um período para ver o histórico local.
          </Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#F8FAFC', flex: 1 },
  content: { flexGrow: 1, gap: 20, padding: 24 },
  heading: { gap: 8, marginBottom: 4 },
  title: { color: '#17324D', fontSize: 28, fontWeight: '700' },
  description: { color: '#334155', fontSize: 16, lineHeight: 24 },
  state: { gap: 12, paddingVertical: 16 },
  stateText: { color: '#475467', fontSize: 15, lineHeight: 22, textAlign: 'center' },
  emptyTitle: { color: '#17324D', fontSize: 18, fontWeight: '700', textAlign: 'center' },
  list: { gap: 12 },
});
