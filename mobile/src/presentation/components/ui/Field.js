import { StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, radius, spacing, touchTarget, typography } from '../../theme/tokens.js';

/**
 * Labelled text field.
 *
 * Errors are announced through a polite live region and the invalid state is exposed to assistive
 * technologies, so the correction is not only visual.
 */
export function Field({
  accessibilityHint,
  error,
  hint,
  label,
  onChangeText,
  required = false,
  value,
  ...inputProps
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      <TextInput
        accessibilityHint={accessibilityHint}
        accessibilityLabel={label}
        accessibilityState={{ invalid: Boolean(error) }}
        onChangeText={onChangeText}
        placeholderTextColor={colors.textDisabled}
        style={[styles.input, error ? styles.invalidInput : null]}
        value={value}
        {...inputProps}
      />
      {error ? (
        <Text accessibilityLiveRegion="polite" accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.sm },
  label: { ...typography.body, color: colors.textPrimary },
  required: { ...typography.bodyStrong, color: colors.danger },
  hint: { ...typography.caption, color: colors.textTertiary },
  input: {
    ...typography.body,
    backgroundColor: colors.surfaceBase,
    borderColor: colors.borderDefault,
    borderRadius: radius.sm,
    borderWidth: 1,
    color: colors.textPrimary,
    minHeight: touchTarget.min,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  invalidInput: { borderColor: colors.danger, borderWidth: 2 },
  error: { ...typography.caption, color: colors.danger },
});
