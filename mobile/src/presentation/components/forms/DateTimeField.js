import { forwardRef } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { FormFeedback } from './FormFeedback.js';

function focusNext(nextFieldRef) {
  nextFieldRef?.current?.focus?.();
}

export const DateTimeField = forwardRef(function DateTimeField(
  {
    accessibilityHint = 'Enter date and time in ISO 8601 UTC format.',
    error,
    label,
    nextFieldRef,
    onSubmitEditing,
    required = false,
    ...inputProps
  },
  ref,
) {
  function handleSubmitEditing(event) {
    onSubmitEditing?.(event);
    focusNext(nextFieldRef);
  }

  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}
        {required ? ' *' : ''}
      </Text>
      <TextInput
        ref={ref}
        accessibilityHint={accessibilityHint}
        accessibilityLabel={label}
        accessibilityState={{ invalid: Boolean(error) }}
        autoCapitalize="none"
        autoCorrect={false}
        blurOnSubmit={!nextFieldRef}
        focusable
        onSubmitEditing={handleSubmitEditing}
        placeholder="YYYY-MM-DDTHH:mm:ss.sssZ"
        placeholderTextColor="#64748B"
        returnKeyType={nextFieldRef ? 'next' : 'done'}
        style={[styles.input, error && styles.invalidInput]}
        {...inputProps}
      />
      <FormFeedback message={error} variant="error" />
    </View>
  );
});

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
});
