import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../../theme/tokens.js';

/**
 * Standard screen shell: optional header block, optional subtitle, and a scrollable body.
 *
 * The body is scrollable by default so that content is never trapped below the fold, which would
 * force horizontal gestures and break reachability on large type scales.
 */
export function Screen({ children, scroll = true, subtitle, title }) {
  const body = (
    <View style={styles.content}>
      {title ? (
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
      ) : null}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {children}
    </View>
  );

  return (
    <View style={styles.screen}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
        >
          {body}
        </ScrollView>
      ) : (
        body
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.surfaceSubtle, flex: 1 },
  scrollContent: { flexGrow: 1, padding: spacing.xl },
  content: { gap: spacing.lg },
  title: { ...typography.display, color: colors.textPrimary },
  subtitle: { ...typography.body, color: colors.textSecondary },
});

export { radius as screenRadius };
