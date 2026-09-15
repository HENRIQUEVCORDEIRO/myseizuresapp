import { useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FormFeedback } from './FormFeedback.js';

function dateFromValue(value) {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function mergeTime(date, time) {
  const result = new Date(date);
  result.setHours(time.getHours(), time.getMinutes(), 0, 0);
  return result;
}

export function NativeDateTimeField({
  accessibilityHint,
  error,
  label,
  maximumDate,
  onValueChange,
  required = false,
  value,
}) {
  const [mode, setMode] = useState(null);
  const selectedDate = dateFromValue(value);

  function handleChange(event, nextDate) {
    const activeMode = mode;
    setMode(null);

    if (event?.type === 'dismissed' || !nextDate) {
      return;
    }

    const result = activeMode === 'time' ? mergeTime(selectedDate, nextDate) : nextDate;
    onValueChange?.(result.toISOString());
  }

  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}
        {required ? ' *' : ''}
      </Text>
      <Text style={styles.value}>{value ? selectedDate.toLocaleString() : 'Not selected'}</Text>
      <View style={styles.actions}>
        <Pressable
          accessibilityHint={accessibilityHint}
          accessibilityLabel={`Select ${label.toLowerCase()} date`}
          accessibilityRole="button"
          accessibilityState={{ invalid: Boolean(error) }}
          focusable
          onPress={() => setMode('date')}
          style={[styles.button, error && styles.invalidButton]}
        >
          <Text style={styles.buttonText}>Choose date</Text>
        </Pressable>
        <Pressable
          accessibilityHint={accessibilityHint}
          accessibilityLabel={`Select ${label.toLowerCase()} time`}
          accessibilityRole="button"
          accessibilityState={{ invalid: Boolean(error) }}
          focusable
          onPress={() => setMode('time')}
          style={[styles.button, error && styles.invalidButton]}
        >
          <Text style={styles.buttonText}>Choose time</Text>
        </Pressable>
      </View>
      {mode ? (
        <DateTimePicker
          maximumDate={mode === 'date' ? maximumDate : undefined}
          mode={mode}
          onChange={handleChange}
          testID={`${label.toLowerCase().replaceAll(' ', '-')}-picker`}
          value={selectedDate}
        />
      ) : null}
      <FormFeedback message={error} variant="error" />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 8 },
  label: { color: '#17324D', fontSize: 16, fontWeight: '600' },
  value: { color: '#475467', fontSize: 16 },
  actions: { flexDirection: 'row', gap: 12 },
  button: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#94A3B8',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 12,
  },
  invalidButton: { borderColor: '#B42318', borderWidth: 2 },
  buttonText: { color: '#17324D', fontSize: 16, fontWeight: '700' },
});
