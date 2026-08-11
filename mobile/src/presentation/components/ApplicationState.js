import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { AccessibleButton } from './AccessibleButton.js';

export function ApplicationState({
  actionHint,
  actionLabel,
  message,
  onAction,
  title,
  variant = 'empty',
}) {
  const isLoading = variant === 'loading';
  const isError = variant === 'error' || variant === 'forbidden';

  return (
    <View
      accessibilityLiveRegion={isLoading ? 'polite' : 'assertive'}
      accessibilityRole={isError ? 'alert' : 'summary'}
      style={styles.container}
    >
      {isLoading ? <ActivityIndicator accessibilityLabel={title} size="large" /> : null}
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <AccessibleButton
          accessibilityHint={actionHint}
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
    alignItems: 'stretch',
    flex: 1,
    gap: 16,
    justifyContent: 'center',
    padding: 24,
  },
  title: { color: '#17324D', fontSize: 24, fontWeight: '700', textAlign: 'center' },
  message: { color: '#334155', fontSize: 16, lineHeight: 24, textAlign: 'center' },
});
