import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, elevation, radius, spacing, touchTarget, typography } from '../../theme/tokens.js';

/**
 * Surface container used for every grouped block of content.
 *
 * When `onPress` is provided the card behaves as a single large affordance (Norman): the whole
 * surface is the target, not only its title.
 */
export function Card({
  accessibilityHint,
  accessibilityLabel,
  accessory,
  children,
  icon,
  onPress,
  title,
}) {
  const content = (
    <>
      {icon ? <Text style={styles.icon}>{icon}</Text> : null}
      <View style={styles.body}>
        {title ? (
          <Text accessibilityRole="header" style={styles.title}>
            {title}
          </Text>
        ) : null}
        {children}
      </View>
      {accessory ? <View style={styles.accessory}>{accessory}</View> : null}
    </>
  );

  if (!onPress) {
    return (
      <View style={styles.card} testID="card">
        {content}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    ...elevation.card,
    backgroundColor: colors.surfaceBase,
    borderColor: colors.borderDefault,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: touchTarget.min,
    padding: spacing.lg,
  },
  pressed: { backgroundColor: colors.surfacePressed },
  icon: { ...typography.subtitle, color: colors.action },
  body: { flex: 1, gap: spacing.xs },
  accessory: { alignItems: 'center', justifyContent: 'center' },
  title: { ...typography.subtitle, color: colors.textPrimary },
});
