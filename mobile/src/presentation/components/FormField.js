import { StyleSheet, Text, TextInput, View } from 'react-native';

export function FormField({ accessibilityHint, error, label, ...inputProps }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityHint={accessibilityHint}
        accessibilityLabel={label}
        accessibilityState={{ invalid: Boolean(error) }}
        placeholderTextColor="#64748B"
        style={[styles.input, error && styles.invalidInput]}
        {...inputProps}
      />
      {error ? (
        <Text accessibilityLiveRegion="polite" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 8 },
  label: { color: '#17324D', fontSize: 16, fontWeight: '600' },
  input: {
    backgroundColor: '#FFFFFF',
    borderColor: '#94A3B8',
    borderRadius: 8,
    borderWidth: 1,
    color: '#0F172A',
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  invalidInput: { borderColor: '#B42318', borderWidth: 2 },
  error: { color: '#B42318', fontSize: 14 },
});
