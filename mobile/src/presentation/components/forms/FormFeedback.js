import { StyleSheet, Text, View } from 'react-native';

const FEEDBACK = Object.freeze({
  error: {
    accessibilityPrefix: 'Error',
    marker: '!',
    liveRegion: 'assertive',
  },
  success: {
    accessibilityPrefix: 'Success',
    marker: '✓',
    liveRegion: 'polite',
  },
  info: {
    accessibilityPrefix: 'Information',
    marker: 'i',
    liveRegion: 'polite',
  },
});

export function FormFeedback({ message, variant = 'error' }) {
  if (!message) {
    return null;
  }

  const feedback = FEEDBACK[variant];

  if (!feedback) {
    throw new TypeError(`Unsupported form feedback variant: ${variant}.`);
  }

  return (
    <View style={[styles.container, styles[variant]]}>
      <Text accessibilityElementsHidden importantForAccessibility="no" style={styles.marker}>
        {feedback.marker}
      </Text>
      <Text
        accessibilityLabel={`${feedback.accessibilityPrefix}: ${message}`}
        accessibilityLiveRegion={feedback.liveRegion}
        accessibilityRole="alert"
        style={styles.message}
      >
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    borderLeftWidth: 4,
    borderRadius: 4,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  error: { backgroundColor: '#FEF3F2', borderLeftColor: '#B42318' },
  success: { backgroundColor: '#ECFDF3', borderLeftColor: '#067647' },
  info: { backgroundColor: '#EFF8FF', borderLeftColor: '#175CD3' },
  marker: { color: '#17324D', fontSize: 16, fontWeight: '800' },
  message: { color: '#17324D', flex: 1, fontSize: 14, lineHeight: 20 },
});
