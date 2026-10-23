import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, radius, spacing, touchTarget, typography } from '../../theme/tokens.js';

const VARIANTS = Object.freeze({
  primary: 'primary',
  secondary: 'secondary',
  ghost: 'ghost',
  danger: 'danger',
});

const SIZES = Object.freeze({
  regular: 'regular',
  compact: 'compact',
});

/**
 * Themed action button. Replaces the ad-hoc `AccessibleButton` usage across screens.
 *
 * Every interactive element in MySeizures MUST expose an accessible role, label, and state, and
 * MUST keep a touch target of at least `touchTarget.min`.
 */
export function Button({
  accessibilityHint,
  accessibilityLabel,
  busy = false,
  disabled = false,
  label,
  onPress,
  size = SIZES.regular,
  title,
  variant = VARIANTS.primary,
}) {
  const unavailable = disabled || busy;
  const text = title ?? label ?? '';
  const isCompact = size === SIZES.compact;

  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel ?? text}
      accessibilityRole="button"
      accessibilityState={{ busy, disabled: unavailable }}
      disabled={unavailable}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        isCompact ? styles.compact : styles.regular,
        styles[variant],
        pressed && !unavailable ? styles.pressed : null,
        unavailable ? styles.disabled : null,
      ]}
    >
      <Text
        style={[
          styles.label,
          isCompact ? typography.caption : typography.bodyStrong,
          variant === VARIANTS.primary || variant === VARIANTS.danger
            ? styles.labelInverse
            : styles.labelDefault,
        ]}
      >
        {text}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 2,
    justifyContent: 'center',
    minHeight: touchTarget.min,
    paddingHorizontal: spacing.xl,
  },
  regular: { paddingVertical: spacing.md },
  compact: { minHeight: touchTarget.min, paddingVertical: spacing.sm },
  primary: { backgroundColor: colors.action, borderColor: colors.action },
  secondary: { backgroundColor: colors.surfaceBase, borderColor: colors.action },
  ghost: { backgroundColor: 'transparent', borderColor: 'transparent' },
  danger: { backgroundColor: colors.danger, borderColor: colors.danger },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.55 },
  label: { textAlign: 'center' },
  labelDefault: { color: colors.action },
  labelInverse: { color: colors.textInverse },
});

export { SIZES as ButtonSizes, VARIANTS as ButtonVariants };
