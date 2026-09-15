import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FormFeedback } from './FormFeedback.js';

const RATINGS = Object.freeze([1, 2, 3, 4, 5]);

export function RatingField({
  accessibilityHint,
  error,
  label,
  onValueChange,
  required = false,
  value,
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}
        {required ? ' *' : ''}
      </Text>
      <Text style={styles.description}>1 is very poor and 5 is very good.</Text>
      <View
        accessibilityHint={accessibilityHint}
        accessibilityLabel={label}
        accessibilityRole="radiogroup"
        accessibilityState={{ invalid: Boolean(error) }}
        style={[styles.options, error && styles.invalidOptions]}
      >
        {RATINGS.map((rating) => {
          const selected = value === rating;

          return (
            <Pressable
              accessibilityLabel={`${label} ${rating}`}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              key={rating}
              onPress={() => onValueChange?.(rating)}
              style={[styles.option, selected && styles.selectedOption]}
            >
              <Text style={[styles.optionText, selected && styles.selectedOptionText]}>
                {rating}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <FormFeedback message={error} variant="error" />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 8 },
  label: { color: '#17324D', fontSize: 16, fontWeight: '600' },
  description: { color: '#475467', fontSize: 14 },
  options: { flexDirection: 'row', gap: 8 },
  invalidOptions: {
    borderColor: '#B42318',
    borderRadius: 8,
    borderWidth: 2,
    padding: 4,
  },
  option: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#94A3B8',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
  },
  selectedOption: { backgroundColor: '#175CD3', borderColor: '#175CD3' },
  optionText: { color: '#17324D', fontSize: 16, fontWeight: '700' },
  selectedOptionText: { color: '#FFFFFF' },
});
