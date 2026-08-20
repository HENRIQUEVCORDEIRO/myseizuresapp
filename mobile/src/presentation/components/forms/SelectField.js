import { StyleSheet, Text, Pressable, View } from 'react-native';

import { FormFeedback } from './FormFeedback.js';

function requireOptions(options) {
  if (!Array.isArray(options) || options.length === 0) {
    throw new TypeError('SelectField requires at least one option.');
  }

  for (const option of options) {
    if (
      !option ||
      typeof option.label !== 'string' ||
      !option.label.trim() ||
      option.value === undefined
    ) {
      throw new TypeError('Each SelectField option requires a label and value.');
    }
  }

  return options;
}

export function SelectField({
  accessibilityHint,
  disabled = false,
  error,
  label,
  onValueChange,
  options,
  required = false,
  value,
}) {
  const validOptions = requireOptions(options);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}
        {required ? ' *' : ''}
      </Text>
      <View
        accessibilityHint={accessibilityHint}
        accessibilityLabel={label}
        accessibilityRole="radiogroup"
        accessibilityState={{ disabled, invalid: Boolean(error) }}
        onValueChange={onValueChange}
        style={[styles.options, error && styles.invalidOptions]}
      >
        {validOptions.map((option) => {
          const selected = Object.is(option.value, value);

          return (
            <Pressable
              key={String(option.value)}
              accessibilityHint={option.accessibilityHint}
              accessibilityLabel={option.label}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected, disabled }}
              disabled={disabled}
              focusable={!disabled}
              onPress={() => onValueChange?.(option.value)}
              style={({ pressed }) => [
                styles.option,
                selected && styles.selectedOption,
                pressed && styles.pressedOption,
                disabled && styles.disabledOption,
              ]}
              tabIndex={disabled ? -1 : 0}
            >
              <Text style={styles.selectionMarker}>{selected ? '●' : '○'}</Text>
              <Text style={styles.optionLabel}>{option.label}</Text>
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
  options: { gap: 8 },
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
    flexDirection: 'row',
    gap: 10,
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  selectedOption: { backgroundColor: '#EFF8FF', borderColor: '#175CD3', borderWidth: 2 },
  pressedOption: { opacity: 0.8 },
  disabledOption: { opacity: 0.55 },
  selectionMarker: { color: '#17324D', fontSize: 18 },
  optionLabel: { color: '#0F172A', flex: 1, fontSize: 16 },
});
