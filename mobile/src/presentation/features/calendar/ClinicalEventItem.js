import { StyleSheet, Text, View } from 'react-native';

import { ClinicalEventType } from '../../../application/use-cases/clinical/index.js';
import { formatDateTime, formatDateTimeLong } from '../../formatters/index.js';
import { labelFor, OCCURRENCE_TYPE_LABELS, TRIGGER_CAUSE_LABELS } from '../../labels.js';

function presentationFor(event) {
  if (event.eventType === ClinicalEventType.SEIZURE) {
    return {
      details: [
        `Tipo de ocorrência: ${labelFor(OCCURRENCE_TYPE_LABELS, event.record.occurrenceType)}`,
      ],
      label: 'Crise',
      style: styles.seizure,
    };
  }

  if (event.eventType === ClinicalEventType.TRIGGER) {
    return {
      details: [
        `Causa: ${labelFor(TRIGGER_CAUSE_LABELS, event.record.commonCause)}`,
        `Qualidade do sono: ${event.record.sleepQuality}`,
        `Humor: ${event.record.mood}`,
        ...(event.record.otherDescription ? [`Outra causa: ${event.record.otherDescription}`] : []),
      ],
      label: 'Possível gatilho',
      style: styles.trigger,
    };
  }

  return { details: [], label: 'Evento clínico', style: styles.unknown };
}

export function ClinicalEventItem({ event }) {
  const presentation = presentationFor(event);

  return (
    <View
      accessible
      accessibilityLabel={`${presentation.label} em ${formatDateTimeLong(event.occurredAt)}`}
      accessibilityRole="text"
      style={[styles.card, presentation.style]}
    >
      <Text style={styles.type}>{presentation.label}</Text>
      <Text style={styles.timestamp}>{formatDateTime(event.occurredAt)}</Text>
      {presentation.details.map((detail) => (
        <Text key={detail} style={styles.detail}>
          {detail}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 6,
    borderRadius: 8,
    gap: 6,
    padding: 16,
  },
  seizure: { borderLeftColor: '#7A5AF8' },
  trigger: { borderLeftColor: '#175CD3' },
  unknown: { borderLeftColor: '#64748B' },
  type: { color: '#17324D', fontSize: 17, fontWeight: '700' },
  timestamp: { color: '#334155', fontSize: 15, fontWeight: '600' },
  detail: { color: '#475467', fontSize: 15, lineHeight: 22 },
});
