import { StyleSheet, Text, View } from 'react-native';

import { ClinicalEventType } from '../../../application/use-cases/clinical/index.js';

function humanize(value) {
  if (typeof value !== 'string' || !value) return 'Not recorded';

  const words = value.toLowerCase().replaceAll('_', ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function presentationFor(event) {
  if (event.eventType === ClinicalEventType.SEIZURE) {
    return {
      details: [`Occurrence type: ${humanize(event.record.occurrenceType)}`],
      label: 'Seizure',
      style: styles.seizure,
    };
  }

  if (event.eventType === ClinicalEventType.TRIGGER) {
    return {
      details: [
        `Cause: ${humanize(event.record.commonCause)}`,
        `Sleep quality: ${event.record.sleepQuality}`,
        `Mood: ${event.record.mood}`,
        ...(event.record.otherDescription ? [`Other cause: ${event.record.otherDescription}`] : []),
      ],
      label: 'Possible trigger',
      style: styles.trigger,
    };
  }

  return { details: [], label: 'Clinical event', style: styles.unknown };
}

export function ClinicalEventItem({ event }) {
  const presentation = presentationFor(event);

  return (
    <View
      accessible
      accessibilityLabel={`${presentation.label} at ${event.occurredAt}`}
      accessibilityRole="listitem"
      style={[styles.card, presentation.style]}
    >
      <Text style={styles.type}>{presentation.label}</Text>
      <Text style={styles.timestamp}>{event.occurredAt}</Text>
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
