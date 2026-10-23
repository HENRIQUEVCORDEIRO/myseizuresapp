import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../../theme/tokens.js';

const TONES = Object.freeze({
  neutral: 'neutral',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
  info: 'info',
});

/**
 * Single metric tile.
 *
 * The value is always rendered as text next to the label, so the metric never depends on a chart
 * shape or a color to be understood.
 */
export function StatTile({ caption, label, tone = TONES.neutral, value }) {
  return (
    <View
      accessibilityLabel={`${label}: ${value}${caption ? `. ${caption}` : ''}`}
      accessibilityRole="summary"
      style={[styles.tile, styles[`${tone}Background`]]}
    >
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, styles[`${tone}Value`]]}>{value}</Text>
      {caption ? <Text style={styles.caption}>{caption}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: radius.md,
    flex: 1,
    gap: spacing.xs,
    minWidth: 96,
    padding: spacing.md,
  },
  label: { ...typography.caption, color: colors.textTertiary },
  value: { ...typography.title, color: colors.textPrimary },
  caption: { ...typography.micro, color: colors.textTertiary },
  neutralBackground: { backgroundColor: colors.surfaceMuted },
  successBackground: { backgroundColor: colors.successBackground },
  warningBackground: { backgroundColor: colors.warningBackground },
  dangerBackground: { backgroundColor: colors.dangerBackground },
  infoBackground: { backgroundColor: colors.infoBackground },
  neutralValue: { color: colors.textPrimary },
  successValue: { color: colors.success },
  warningValue: { color: colors.warning },
  dangerValue: { color: colors.danger },
  infoValue: { color: colors.info },
});

export { TONES as StatTileTones };
