import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, touchTarget, typography } from '../../theme/tokens.js';
import { FormFeedback } from '../forms/FormFeedback.js';

/**
 * Group of large, explicit choices.
 *
 * Used instead of a dropdown for small enumerations so the user spends one tap instead of two,
 * and can read every option before deciding.
 */
export function ChoiceGroup({
  accessibilityHint,
  accessibilityLabel,
  error,
  label,
  multiple = false,
  onValueChange,
  options = [],
  required = false,
  value,
  values = [],
}) {
  function isSelected(optionValue) {
    return multiple ? values.includes(optionValue) : optionValue === value;
  }

  function select(optionValue) {
    if (!multiple) {
      onValueChange(optionValue);
      return;
    }

    const next = isSelected(optionValue)
      ? values.filter((item) => item !== optionValue)
      : [...values, optionValue];
    onValueChange(next);
  }

  return (
    <View style={styles.field}>
      {label ? (
        <Text style={styles.fieldLabel}>
          {label}
          {required ? <Text style={styles.required}> *</Text> : null}
        </Text>
      ) : null}
      <View
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityRole="radiogroup"
        accessibilityState={error ? { invalid: true } : undefined}
        style={[styles.group, error ? styles.invalidGroup : null]}
      >
        {options.map((option) => {
          const selected = isSelected(option.value);

          return (
            <Pressable
              accessibilityHint={accessibilityHint}
              accessibilityLabel={option.label}
              accessibilityRole={multiple ? 'checkbox' : 'radio'}
              accessibilityState={{ checked: selected }}
              key={String(option.value)}
              onPress={() => select(option.value)}
              style={({ pressed }) => [
                styles.option,
                selected ? styles.selected : styles.unselected,
                pressed ? styles.pressed : null,
              ]}
            >
              <View style={styles.copy}>
                <Text style={[styles.label, selected ? styles.selectedLabel : styles.label]}>
                  {option.label}
                </Text>
                {option.description ? (
                  <Text style={styles.description}>{option.description}</Text>
                ) : null}
              </View>
              <Text accessibilityElementsHidden style={styles.marker}>
                {selected ? '✓' : '○'}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <FormFeedback message={error} variant="error" />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.sm },
  fieldLabel: { ...typography.body, color: colors.textPrimary },
  required: { ...typography.bodyStrong, color: colors.danger },
  invalidGroup: {
    borderColor: colors.danger,
    borderRadius: radius.md,
    borderWidth: 2,
    padding: spacing.xs,
  },
  group: { gap: spacing.sm },
  option: {
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 2,
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    minHeight: touchTarget.comfortable,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  unselected: { backgroundColor: colors.surfaceBase, borderColor: colors.borderDefault },
  selected: { backgroundColor: colors.infoBackground, borderColor: colors.action },
  pressed: { opacity: 0.8 },
  copy: { flex: 1, gap: spacing.xs },
  label: { ...typography.bodyStrong, color: colors.textPrimary },
  selectedLabel: { ...typography.bodyStrong, color: colors.textPrimary },
  description: { ...typography.caption, color: colors.textTertiary },
  marker: { ...typography.bodyStrong, color: colors.action },
});
