import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, touchTarget, typography } from '../../theme/tokens.js';

/**
 * Single-choice segmented control.
 *
 * Replaces the repeated dropdown used to pick a report period. The control keeps every option
 * visible so the user recognizes rather than recalls (Nielsen), and the selection is marked by
 * fill, weight, and an accessible state, not by color alone.
 */
export function SegmentedControl({
  accessibilityHint,
  accessibilityLabel,
  onValueChange,
  options = [],
  value,
}) {
  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="radiogroup"
      style={styles.group}
    >
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <Pressable
            accessibilityHint={accessibilityHint}
            accessibilityLabel={option.label}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            key={option.value}
            onPress={() => onValueChange(option.value)}
            style={({ pressed }) => [
              styles.option,
              selected ? styles.selected : styles.unselected,
              pressed ? styles.pressed : null,
            ]}
          >
            <Text style={[styles.label, selected ? styles.selectedLabel : styles.unselectedLabel]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: spacing.xs,
    padding: spacing.xs,
  },
  option: {
    alignItems: 'center',
    borderRadius: radius.pill,
    flex: 1,
    justifyContent: 'center',
    minHeight: touchTarget.min,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  unselected: { backgroundColor: 'transparent' },
  selected: { backgroundColor: colors.surfaceBase },
  pressed: { opacity: 0.8 },
  label: { ...typography.bodyStrong, textAlign: 'center' },
  unselectedLabel: { color: colors.textTertiary },
  selectedLabel: { color: colors.textPrimary },
});
