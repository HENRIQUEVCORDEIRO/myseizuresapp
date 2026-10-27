import { useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { dateToTimeValue, timeValueToDate } from '../../formatters/index.js';
import { FormFeedback } from './FormFeedback.js';

function normalizeTimes(values) {
  return [...new Set(values)].sort();
}

export function TimeListField({
  accessibilityHint,
  error,
  label,
  onChange,
  required = false,
  value = [],
}) {
  const [editor, setEditor] = useState(null);
  const times = Array.isArray(value) ? value : [];

  function openAdd() {
    setEditor({ date: timeValueToDate('08:00'), index: null });
  }

  function openEdit(time, index) {
    setEditor({ date: timeValueToDate(time), index });
  }

  function handleChange(event, nextDate) {
    const current = editor;
    setEditor(null);

    if (event?.type === 'dismissed' || !nextDate || !current) {
      return;
    }

    const next = [...times];
    if (current.index === null) {
      next.push(dateToTimeValue(nextDate));
    } else {
      next[current.index] = dateToTimeValue(nextDate);
    }

    onChange?.(normalizeTimes(next));
  }

  function remove(index) {
    onChange?.(times.filter((_time, timeIndex) => timeIndex !== index));
  }

  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}
        {required ? ' *' : ''}
      </Text>
      {times.length ? (
        times.map((time, index) => (
          <View key={`${time}-${index}`} style={styles.row}>
            <Text style={styles.time}>{time}</Text>
            <Pressable
              accessibilityLabel={`Alterar horário ${time}`}
              accessibilityRole="button"
              focusable
              onPress={() => openEdit(time, index)}
              style={styles.action}
            >
              <Text style={styles.actionText}>Alterar</Text>
            </Pressable>
            <Pressable
              accessibilityLabel={`Remover horário ${time}`}
              accessibilityRole="button"
              focusable
              onPress={() => remove(index)}
              style={styles.action}
            >
              <Text style={styles.removeText}>Remover</Text>
            </Pressable>
          </View>
        ))
      ) : (
        <Text style={styles.empty}>Nenhum horário informado.</Text>
      )}
      <Pressable
        accessibilityHint={accessibilityHint}
        accessibilityLabel="Adicionar horário"
        accessibilityRole="button"
        focusable
        onPress={openAdd}
        style={[styles.addButton, error && styles.invalidButton]}
      >
        <Text style={styles.addText}>Adicionar horário</Text>
      </Pressable>
      {editor ? (
        <DateTimePicker
          mode="time"
          onChange={handleChange}
          testID="treatment-time-picker"
          value={editor.date}
        />
      ) : null}
      <FormFeedback message={error} variant="error" />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 8 },
  label: { color: '#17324D', fontSize: 16, fontWeight: '600' },
  row: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#CBD5E1',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    minHeight: 48,
    paddingHorizontal: 12,
  },
  time: { color: '#17324D', flex: 1, fontSize: 18, fontWeight: '700' },
  action: { justifyContent: 'center', minHeight: 44, paddingHorizontal: 4 },
  actionText: { color: '#1D4ED8', fontSize: 15, fontWeight: '700' },
  removeText: { color: '#B42318', fontSize: 15, fontWeight: '700' },
  empty: { color: '#475467', fontSize: 15 },
  addButton: {
    alignItems: 'center',
    borderColor: '#94A3B8',
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 12,
  },
  invalidButton: { borderColor: '#B42318', borderWidth: 2 },
  addText: { color: '#17324D', fontSize: 16, fontWeight: '700' },
});
