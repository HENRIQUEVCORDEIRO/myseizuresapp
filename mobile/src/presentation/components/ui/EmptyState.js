import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../../theme/tokens.js';
import { Button } from './Button.js';

/**
 * Empty or zero-result state.
 *
 * Used when a screen has no data to show. It always states what is missing and, when a recovery
 * action exists, offers it — a dead end with no next step is a usability failure.
 */
export function EmptyState({ actionLabel, description, icon, onAction, title }) {
  return (
    <View accessibilityRole="summary" style={styles.container}>
      {icon ? <Text style={styles.icon}>{icon}</Text> : null}
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {actionLabel && onAction ? (
        <Button
          accessibilityLabel={actionLabel}
          onPress={onAction}
          title={actionLabel}
          variant="secondary"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    gap: spacing.sm,
    padding: spacing.xl,
  },
  icon: { ...typography.display, color: colors.textTertiary },
  title: { ...typography.subtitle, color: colors.textPrimary, textAlign: 'center' },
  description: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
});
