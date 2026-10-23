import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, radius, spacing, touchTarget, typography } from '../../theme/tokens.js';

/**
 * Compact selectable token used for filters, multi-select options, and period choices.
 *
 * The selected state is conveyed by fill, border weight, and a check mark, never by color alone.
 */
export function Chip({
  accessibilityHint,
  accessibilityLabel,
  icon,
  label,
  onPress,
  selected = false,
}) {
  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected ? styles.selected : styles.unselected,
        pressed ? styles.pressed : null,
      ]}
    >
      {icon ? <Text style={styles.icon}>{icon}</Text> : null}
      <Text style={[styles.label, selected ? styles.selectedLabel : styles.unselectedLabel]}>
        {label}
      </Text>
      {selected ? (
        <Text accessibilityElementsHidden style={styles.check}>
          ✓
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 2,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: touchTarget.min,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  unselected: { backgroundColor: colors.surfaceBase, borderColor: colors.borderDefault },
  selected: { backgroundColor: colors.infoBackground, borderColor: colors.action },
  pressed: { opacity: 0.8 },
  icon: { ...typography.body, color: colors.action },
  label: { ...typography.body, flexShrink: 1 },
  unselectedLabel: { color: colors.textSecondary },
  selectedLabel: { color: colors.textPrimary, fontWeight: '700' },
  check: { ...typography.bodyStrong, color: colors.action },
});
