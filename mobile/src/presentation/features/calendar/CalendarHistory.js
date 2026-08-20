import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AccessibleButton, DateTimeField, FormFeedback } from '../../components/index.js';
import { ClinicalEventItem } from './ClinicalEventItem.js';

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

function defaultPeriod() {
  const periodEnd = new Date();
  const periodStart = new Date(periodEnd.getTime() - 7 * DAY_IN_MILLISECONDS);

  return { periodStart: periodStart.toISOString(), periodEnd: periodEnd.toISOString() };
}

function requirePeriod(periodStartValue, periodEndValue) {
  const periodStart = periodStartValue.trim();
  const periodEnd = periodEndValue.trim();
  const errors = {};

  if (!periodStart) errors.periodStart = 'Start date and time is required.';
  if (!periodEnd) errors.periodEnd = 'End date and time is required.';

  if (periodStart && !Number.isFinite(Date.parse(periodStart))) {
    errors.periodStart = 'Start must be a valid ISO 8601 date and time.';
  }

  if (periodEnd && !Number.isFinite(Date.parse(periodEnd))) {
    errors.periodEnd = 'End must be a valid ISO 8601 date and time.';
  }

  if (!errors.periodStart && !errors.periodEnd && Date.parse(periodStart) > Date.parse(periodEnd)) {
    errors.periodEnd = 'End date and time must be on or after the start.';
  }

  return { errors, period: { periodStart, periodEnd } };
}

export function CalendarHistory({
  initialPeriod,
  listChronologicalEvents,
  loadOnMount = true,
  patientId,
}) {
  const initialPeriodRef = useRef(initialPeriod ?? (loadOnMount ? defaultPeriod() : {}));
  const [periodStart, setPeriodStart] = useState(initialPeriodRef.current.periodStart ?? '');
  const [periodEnd, setPeriodEnd] = useState(initialPeriodRef.current.periodEnd ?? '');
  const [errors, setErrors] = useState({});
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState('idle');
  const [loadError, setLoadError] = useState(null);

  const loadPeriod = useCallback(
    async (period) => {
      setStatus('loading');
      setLoadError(null);

      try {
        const result = await listChronologicalEvents.execute({ patientId, ...period });
        setEvents(result);
        setStatus('success');
      } catch (error) {
        setEvents([]);
        setLoadError(error?.message || 'The local history could not be loaded.');
        setStatus('error');
      }
    },
    [listChronologicalEvents, patientId],
  );

  useEffect(() => {
    if (loadOnMount) {
      void loadPeriod(initialPeriodRef.current);
    }
  }, [loadOnMount, loadPeriod]);

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
            Calendar and history
          </Text>
          <Text style={styles.description}>
            Choose an inclusive period to review seizure and possible-trigger records saved on this
            device.
          </Text>
        </View>
        <DateTimeField
          accessibilityHint="Enter the beginning of the history period in UTC"
          error={errors.periodStart}
          label="Period start"
          onChangeText={setPeriodStart}
          required
          value={periodStart}
        />
        <DateTimeField
          accessibilityHint="Enter the end of the history period in UTC"
          error={errors.periodEnd}
          label="Period end"
          onChangeText={setPeriodEnd}
          required
          value={periodEnd}
        />
        <AccessibleButton
          accessibilityHint="Loads locally saved events in the selected inclusive period"
          accessibilityLabel="View history"
          busy={status === 'loading'}
          onPress={submit}
          title="View history"
        />

        {status === 'loading' ? (
          <View accessibilityLiveRegion="polite" style={styles.state}>
            <ActivityIndicator accessibilityLabel="Loading clinical history" size="large" />
            <Text style={styles.stateText}>Loading history…</Text>
          </View>
        ) : null}

        {status === 'error' ? (
          <View style={styles.state}>
            <FormFeedback message={loadError} variant="error" />
            <AccessibleButton
              accessibilityHint="Attempts to load the selected period again"
              accessibilityLabel="Try again"
              onPress={() => loadPeriod({ periodStart, periodEnd })}
              title="Try again"
              variant="secondary"
            />
          </View>
        ) : null}

        {status === 'success' && events.length === 0 ? (
          <View accessibilityRole="summary" style={styles.state}>
            <Text accessibilityRole="header" style={styles.emptyTitle}>
              No events in this period.
            </Text>
            <Text style={styles.stateText}>Try a wider period or record a new clinical event.</Text>
          </View>
        ) : null}

        {status === 'success' && events.length > 0 ? (
          <View
            accessibilityLabel="Chronological clinical events"
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
            Select a period to view your local history.
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
