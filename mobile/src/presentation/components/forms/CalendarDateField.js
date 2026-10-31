import { useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  calendarDateToDate,
  dateToCalendarDate,
  formatCalendarDate,
} from '../../formatters/index.js';
import { colors, radius, spacing, touchTarget, typography } from '../../theme/tokens.js';
import { FormFeedback } from './FormFeedback.js';

export function CalendarDateField({
  accessibilityHint,
  error,
  label,
  maximumDate,
  minimumDate,
  onValueChange,
  required = false,
  testID,
  value,
}) {
  const [open, setOpen] = useState(false);

  function handleChange(event, nextDate) {
    setOpen(false);

    if (event?.type === 'dismissed' || !nextDate) {
      return;
    }

    onValueChange?.(dateToCalendarDate(nextDate));
  }

  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}
        {required ? ' *' : ''}
      </Text>
      <Text style={styles.value}>{value ? formatCalendarDate(value) : 'Não selecionada'}</Text>
      <Pressable
        accessibilityHint={accessibilityHint}
        accessibilityLabel={`Escolher data — ${label}`}
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        style={[styles.action, error ? styles.invalidAction : null]}
      >
        <Text style={styles.actionText}>Escolher data</Text>
      </Pressable>
      {open ? (
        <DateTimePicker
          maximumDate={maximumDate}
          minimumDate={minimumDate}
          mode="date"
          onChange={handleChange}
          testID={testID ?? 'calendar-date-picker'}
          value={calendarDateToDate(value)}
        />
      ) : null}
      <FormFeedback message={error} variant="error" />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.sm },
  label: { ...typography.bodyStrong, color: colors.textPrimary },
  value: { ...typography.body, color: colors.textSecondary },
  action: {
    alignItems: 'center',
    borderColor: colors.borderStrong,
    borderRadius: radius.sm,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: touchTarget.min,
    paddingHorizontal: spacing.md,
  },
  invalidAction: { borderColor: colors.danger, borderWidth: 2 },
  actionText: { ...typography.bodyStrong, color: colors.action },
});
