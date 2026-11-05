import { act, create } from 'react-test-renderer';
import { StyleSheet } from 'react-native';

import {
  AccessibleButton,
  ApplicationState,
  FormField,
} from '../../../src/presentation/components/index.js';

describe('accessible presentation components', () => {
  test('button exposes a label, hint, role, and disabled state', () => {
    let renderer;

    act(() => {
      renderer = create(
        <AccessibleButton
          accessibilityHint="Submits the form"
          accessibilityLabel="Sign in"
          disabled
          onPress={jest.fn()}
          title="Sign in"
        />,
      );
    });

    const button = renderer.root.findByProps({ accessibilityRole: 'button' });
    expect(button.props.accessibilityLabel).toBe('Sign in');
    expect(button.props.accessibilityHint).toBe('Submits the form');
    expect(button.props.accessibilityState).toEqual({ busy: false, disabled: true });
  });

  test('form field exposes its label and hint to assistive technology', () => {
    let renderer;

    act(() => {
      renderer = create(
        <FormField
          accessibilityHint="Enter your account email"
          label="Email"
          onChangeText={jest.fn()}
          value="patient@example.com"
        />,
      );
    });

    const input = renderer.root.findByProps({ accessibilityLabel: 'Email' });
    expect(input.props.accessibilityHint).toBe('Enter your account email');
  });

  test('form field supports a multiline input style for longer descriptions', () => {
    let renderer;

    act(() => {
      renderer = create(
        <FormField
          inputStyle={{ minHeight: 120, paddingTop: 12 }}
          label="Description"
          multiline
          onChangeText={jest.fn()}
          textAlignVertical="top"
          value=""
        />,
      );
    });

    const input = renderer.root.findByProps({ accessibilityLabel: 'Description' });
    const style = StyleSheet.flatten(input.props.style);
    expect(input.props.multiline).toBe(true);
    expect(input.props.textAlignVertical).toBe('top');
    expect(style.minHeight).toBe(120);
    expect(style.paddingTop).toBe(12);
  });

  test('error state is announced and offers an accessible recovery action', () => {
    let renderer;

    act(() => {
      renderer = create(
        <ApplicationState
          actionHint="Retries startup"
          actionLabel="Try again"
          message="Could not start the application."
          onAction={jest.fn()}
          title="Something went wrong"
          variant="error"
        />,
      );
    });

    expect(renderer.root.findByProps({ accessibilityRole: 'alert' })).toBeTruthy();
    expect(renderer.root.findByProps({ accessibilityLabel: 'Try again' })).toBeTruthy();
  });
});
