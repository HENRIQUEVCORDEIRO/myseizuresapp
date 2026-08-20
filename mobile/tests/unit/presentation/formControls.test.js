import { act, create } from 'react-test-renderer';

import {
  DateTimeField,
  FormFeedback,
  SelectField,
} from '../../../src/presentation/components/forms/index.js';

describe('accessible form controls', () => {
  test('date/time field exposes its label, validation, and next-field focus action', () => {
    const onChangeText = jest.fn();
    const onSubmitEditing = jest.fn();
    const nextFieldRef = { current: { focus: jest.fn() } };
    let renderer;

    act(() => {
      renderer = create(
        <DateTimeField
          accessibilityHint="Enter the seizure time in UTC"
          error="Date and time is required."
          label="Seizure date and time"
          nextFieldRef={nextFieldRef}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmitEditing}
          value=""
        />,
      );
    });

    const input = renderer.root.findByProps({ accessibilityLabel: 'Seizure date and time' });
    expect(input.props.accessibilityState).toEqual({ invalid: true });
    expect(input.props.accessibilityHint).toBe('Enter the seizure time in UTC');
    expect(input.props.returnKeyType).toBe('next');
    expect(
      renderer.root.findByProps({ accessibilityLabel: 'Error: Date and time is required.' }).props
        .accessibilityRole,
    ).toBe('alert');

    act(() => {
      input.props.onChangeText('2026-08-10T12:30:00.000Z');
      input.props.onSubmitEditing();
    });

    expect(onChangeText).toHaveBeenCalledWith('2026-08-10T12:30:00.000Z');
    expect(onSubmitEditing).toHaveBeenCalledTimes(1);
    expect(nextFieldRef.current.focus).toHaveBeenCalledTimes(1);
  });

  test('select exposes labelled options in source order and announces validation', () => {
    const onValueChange = jest.fn();
    let renderer;

    act(() => {
      renderer = create(
        <SelectField
          accessibilityHint="Choose one occurrence type"
          error="Occurrence type is required."
          label="Occurrence type"
          onValueChange={onValueChange}
          options={[
            { label: 'Focal', value: 'FOCAL' },
            { label: 'Generalized', value: 'GENERALIZED' },
          ]}
          value="FOCAL"
        />,
      );
    });

    const select = renderer.root.findByProps({ accessibilityRole: 'radiogroup' });
    const options = renderer.root
      .findAllByProps({ accessibilityRole: 'radio' })
      .filter((option) => typeof option.props.style === 'function');

    expect(select.props.accessibilityLabel).toBe('Occurrence type');
    expect(select.props.accessibilityState).toEqual({ disabled: false, invalid: true });
    expect(options.map((option) => option.props.accessibilityLabel)).toEqual([
      'Focal',
      'Generalized',
    ]);
    expect(options[0].props.accessibilityState).toEqual({ checked: true, disabled: false });
    expect(options[1].props.accessibilityState).toEqual({ checked: false, disabled: false });
    expect(options.every((option) => option.props.focusable)).toBe(true);
    expect(
      renderer.root.findByProps({ accessibilityLabel: 'Error: Occurrence type is required.' }).props
        .accessibilityRole,
    ).toBe('alert');

    act(() => {
      options[1].props.onPress();
      select.props.onValueChange('GENERALIZED');
    });

    expect(onValueChange).toHaveBeenNthCalledWith(1, 'GENERALIZED');
    expect(onValueChange).toHaveBeenNthCalledWith(2, 'GENERALIZED');
  });

  test.each([
    ['error', 'Check the highlighted fields.', 'assertive'],
    ['success', 'Seizure saved.', 'polite'],
  ])(
    'form feedback exposes %s status without relying on colour',
    (variant, message, liveRegion) => {
      let renderer;

      act(() => {
        renderer = create(<FormFeedback message={message} variant={variant} />);
      });

      const feedback = renderer.root.findByProps({ accessibilityRole: 'alert' });
      expect(feedback.props.accessibilityLiveRegion).toBe(liveRegion);
      expect(feedback.props.accessibilityLabel).toContain(
        variant === 'error' ? 'Error' : 'Success',
      );
      expect(feedback.props.accessibilityLabel).toContain(message);
    },
  );
});
