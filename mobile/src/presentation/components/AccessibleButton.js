import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

export function AccessibleButton({
  accessibilityHint,
  accessibilityLabel,
  busy = false,
  disabled = false,
  onPress,
  title,
  variant = 'primary',
}) {
  const unavailable = disabled || busy;

  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ busy, disabled: unavailable }}
      disabled={unavailable}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'secondary' ? styles.secondary : styles.primary,
        pressed && styles.pressed,
        unavailable && styles.disabled,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={variant === 'secondary' ? '#17324D' : '#FFFFFF'} />
      ) : (
        <Text style={variant === 'secondary' ? styles.secondaryText : styles.primaryText}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  primary: { backgroundColor: '#175CD3' },
  secondary: { backgroundColor: '#E8EEF5' },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.55 },
  primaryText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  secondaryText: { color: '#17324D', fontSize: 16, fontWeight: '700' },
});
