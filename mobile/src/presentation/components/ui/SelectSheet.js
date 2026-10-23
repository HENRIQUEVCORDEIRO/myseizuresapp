import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, elevation, radius, spacing, touchTarget, typography } from '../../theme/tokens.js';

const OTHER_VALUE = 'OTHER';

function sameValues(left, right) {
  return left.length === right.length && left.every((item, index) => item === right[index]);
}

/**
 * Bottom sheet for long option lists.
 *
 * The free-text "other" field appears only when the free-form option is selected, so the common
 * path stays short. The sheet never closes on an outside tap: closing is always an explicit
 * action, which prevents silent data loss (Nielsen — prevention of errors).
 */
export function SelectSheet({
  allowOther = false,
  multiple = false,
  onClose,
  onConfirm,
  onOtherTextChange,
  options = [],
  otherText = '',
  title,
  value,
  values = [],
  visible = false,
}) {
  const [selection, setSelection] = useState([]);
  const [other, setOther] = useState(otherText);

  useEffect(() => {
    if (!visible) {
      return;
    }

    // The equality guard is required: callers commonly pass inline arrays, so a new reference
    // arrives on every render. Without it the state update would re-trigger this effect forever.
    setSelection((current) => {
      const next = multiple ? [...values] : value === undefined || value === null ? [] : [value];
      return sameValues(current, next) ? current : next;
    });
    setOther((current) => (current === otherText ? current : otherText));
  }, [multiple, otherText, value, values, visible]);

  const selectedValues = selection;
  const hasOther = selectedValues.includes(OTHER_VALUE);

  function toggle(optionValue) {
    if (!multiple) {
      setSelection([optionValue]);
      return;
    }

    setSelection(
      selectedValues.includes(optionValue)
        ? selectedValues.filter((item) => item !== optionValue)
        : [...selectedValues, optionValue],
    );
  }

  function updateOther(text) {
    setOther(text);
    if (typeof onOtherTextChange === 'function') onOtherTextChange(text);
  }

  function confirm() {
    if (typeof onConfirm !== 'function') {
      onClose();
      return;
    }

    onConfirm({
      other: hasOther ? other.trim() : undefined,
      value: multiple ? undefined : (selectedValues[0] ?? null),
      values: selectedValues,
    });
  }

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      transparent
      visible={visible}
      accessibilityViewIsModal
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text accessibilityRole="header" style={styles.title}>
              {title}
            </Text>
            <Pressable
              accessibilityLabel="Fechar seleção"
              accessibilityRole="button"
              onPress={onClose}
              style={styles.close}
            >
              <Text style={styles.closeLabel}>✕</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
            {options.map((option) => {
              const selected = selectedValues.includes(option.value);

              return (
                <Pressable
                  accessibilityLabel={option.label}
                  accessibilityRole={multiple ? 'checkbox' : 'radio'}
                  accessibilityState={{ checked: multiple, selected: !multiple && selected }}
                  key={option.value}
                  onPress={() => toggle(option.value)}
                  style={({ pressed }) => [
                    styles.option,
                    selected ? styles.optionSelected : null,
                    pressed ? styles.pressed : null,
                  ]}
                >
                  <Text style={[styles.optionLabel, selected ? styles.optionLabelSelected : null]}>
                    {option.label}
                  </Text>
                  <Text accessibilityElementsHidden style={styles.marker}>
                    {selected ? '✓' : '○'}
                  </Text>
                </Pressable>
              );
            })}

            {allowOther && hasOther ? (
              <View style={styles.other}>
                <Text style={styles.otherLabel}>Descreva em poucas palavras</Text>
                <TextInput
                  accessibilityLabel="Descrição da outra opção"
                  accessibilityRole="text"
                  onChangeText={updateOther}
                  placeholder="Escreva aqui"
                  placeholderTextColor={colors.textDisabled}
                  style={styles.otherInput}
                  value={other}
                />
              </View>
            ) : null}
          </ScrollView>

          <Pressable
            accessibilityLabel="Confirmar seleção"
            accessibilityRole="button"
            onPress={confirm}
            style={({ pressed }) => [styles.confirm, pressed ? styles.pressed : null]}
          >
            <Text style={styles.confirmLabel}>Confirmar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(16, 24, 40, 0.45)', flex: 1, justifyContent: 'flex-end' },
  sheet: {
    ...elevation.sheet,
    backgroundColor: colors.surfaceBase,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    gap: spacing.md,
    maxHeight: '85%',
    padding: spacing.xl,
  },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  title: { ...typography.subtitle, color: colors.textPrimary, flex: 1 },
  close: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    height: touchTarget.min,
    justifyContent: 'center',
    width: touchTarget.min,
  },
  closeLabel: { ...typography.bodyStrong, color: colors.textSecondary },
  list: { gap: spacing.xs, paddingVertical: spacing.sm },
  option: {
    alignItems: 'center',
    borderRadius: radius.sm,
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    minHeight: touchTarget.min,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  optionSelected: { backgroundColor: colors.infoBackground },
  pressed: { opacity: 0.8 },
  optionLabel: { ...typography.body, color: colors.textSecondary, flex: 1 },
  optionLabelSelected: { ...typography.bodyStrong, color: colors.textPrimary },
  marker: { ...typography.bodyStrong, color: colors.action },
  other: { gap: spacing.sm, paddingTop: spacing.md },
  otherLabel: { ...typography.caption, color: colors.textSecondary },
  otherInput: {
    ...typography.body,
    backgroundColor: colors.surfaceBase,
    borderColor: colors.borderDefault,
    borderRadius: radius.sm,
    borderWidth: 1,
    color: colors.textPrimary,
    minHeight: touchTarget.min,
    paddingHorizontal: spacing.md,
  },
  confirm: {
    alignItems: 'center',
    backgroundColor: colors.action,
    borderRadius: radius.pill,
    justifyContent: 'center',
    minHeight: touchTarget.min,
    paddingHorizontal: spacing.xl,
  },
  confirmLabel: { ...typography.bodyStrong, color: colors.textInverse },
});
