import { act, create } from 'react-test-renderer';
import { StyleSheet } from 'react-native';

import { SeizureEntryForm } from '../../app/(patient)/seizures/new.js';
import { ProfessionalPatientAccess } from '../../app/(professional)/patients/index.js';
import {
  AccessibleButton,
  FormFeedback,
  SelectField,
} from '../../src/presentation/components/index.js';
import { ClinicalAlertList } from '../../src/presentation/features/reports/ClinicalAlertList.js';

const MINIMUM_TOUCH_TARGET = 48;
const MINIMUM_NORMAL_TEXT_CONTRAST = 4.5;

function render(element) {
  let renderer;
  act(() => {
    renderer = create(element);
  });
  return renderer;
}

function flattenInteractiveStyle(style) {
  return StyleSheet.flatten(typeof style === 'function' ? style({ pressed: false }) : style);
}

function relativeLuminance(hexColor) {
  const channels = hexColor
    .replace('#', '')
    .match(/.{2}/g)
    .map((channel) => Number.parseInt(channel, 16) / 255)
    .map((channel) => (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4));
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(foreground, background) {
  const luminances = [relativeLuminance(foreground), relativeLuminance(background)].sort(
    (left, right) => right - left,
  );
  return (luminances[0] + 0.05) / (luminances[1] + 0.05);
}

function labelledNodes(renderer) {
  return renderer.root
    .findAll((node) => typeof node.props.accessibilityLabel === 'string')
    .map((node) => node.props.accessibilityLabel);
}

function accessibleNode(renderer, label, role) {
  return renderer.root.find(
    (node) => node.props.accessibilityLabel === label && node.props.accessibilityRole === role,
  );
}

function renderedText(renderer) {
  return JSON.stringify(renderer.toJSON());
}

function nodeText(node) {
  return node.children
    .map((child) => (typeof child === 'string' ? child : nodeText(child)))
    .join('');
}

describe('critical-screen accessibility regressions', () => {
  test('patient seizure entry exposes labels in a predictable source and focus order', () => {
    const renderer = render(
      <SeizureEntryForm
        patientId={1}
        recordSeizure={{ execute: jest.fn().mockResolvedValue(undefined) }}
      />,
    );
    const labels = labelledNodes(renderer);
    const dateIndex = labels.indexOf('Seizure date and time');
    const typeIndex = labels.indexOf('Occurrence type');
    const saveIndex = labels.indexOf('Save seizure');

    expect(dateIndex).toBeGreaterThanOrEqual(0);
    expect(typeIndex).toBeGreaterThan(dateIndex);
    expect(saveIndex).toBeGreaterThan(typeIndex);
    expect(
      renderer.root.findByProps({ accessibilityLabel: 'Seizure date and time' }).props,
    ).toEqual(expect.objectContaining({ focusable: true, returnKeyType: 'done' }));
    expect(accessibleNode(renderer, 'Save seizure', 'button').props).toEqual(
      expect.objectContaining({
        accessibilityHint: expect.stringMatching(/saves this seizure on the device/i),
        accessibilityRole: 'button',
      }),
    );
  });

  test('professional patient-access controls are labelled and ordered before private results', () => {
    const renderer = render(
      <ProfessionalPatientAccess
        authorizePatientAccess={{ execute: jest.fn().mockResolvedValue({ ok: true }) }}
      />,
    );
    const labels = labelledNodes(renderer);

    expect(labels.indexOf('Patient identifier')).toBeGreaterThanOrEqual(0);
    expect(labels.indexOf('Check patient access')).toBeGreaterThan(
      labels.indexOf('Patient identifier'),
    );
    expect(renderer.root.findByProps({ accessibilityLabel: 'Patient identifier' }).props).toEqual(
      expect.objectContaining({
        accessibilityHint: expect.stringMatching(/numeric identifier/i),
      }),
    );
    expect(accessibleNode(renderer, 'Check patient access', 'button').props).toEqual(
      expect.objectContaining({ accessibilityRole: 'button' }),
    );
  });
});

describe('touch-target and contrast regressions', () => {
  test.each(['primary', 'secondary'])(
    '%s button retains a large target and readable contrast',
    (variant) => {
      const renderer = render(
        <AccessibleButton
          accessibilityLabel={`${variant} action`}
          onPress={jest.fn()}
          title="Continue"
          variant={variant}
        />,
      );
      const button = accessibleNode(renderer, `${variant} action`, 'button');
      const nativeButton = renderer.toJSON();
      const buttonStyle = StyleSheet.flatten(nativeButton.props.style);
      const textStyle = StyleSheet.flatten(nativeButton.children[0].props.style);

      expect(button.props.accessibilityState.disabled).toBe(false);
      expect(buttonStyle.minHeight).toBeGreaterThanOrEqual(MINIMUM_TOUCH_TARGET);
      expect(contrastRatio(textStyle.color, buttonStyle.backgroundColor)).toBeGreaterThanOrEqual(
        MINIMUM_NORMAL_TEXT_CONTRAST,
      );
    },
  );

  test('select options retain accessible state, touch size, and text contrast', () => {
    const renderer = render(
      <SelectField
        label="Report period"
        onValueChange={jest.fn()}
        options={[
          { label: 'Weekly', value: 'WEEKLY' },
          { label: 'Monthly', value: 'MONTHLY' },
        ]}
        value="WEEKLY"
      />,
    );
    const options = renderer.root
      .findAllByProps({ accessibilityRole: 'radio' })
      .filter((node) => typeof node.props.style === 'function');

    expect(options).toHaveLength(2);
    for (const option of options) {
      const optionStyle = flattenInteractiveStyle(option.props.style);
      const labelStyle = StyleSheet.flatten(
        option.find(
          (node) => node.props.style && nodeText(node) === option.props.accessibilityLabel,
        ).props.style,
      );

      expect(option.props.focusable).toBe(true);
      expect(option.props.accessibilityState).toEqual(
        expect.objectContaining({ checked: expect.any(Boolean), disabled: false }),
      );
      expect(optionStyle.minHeight).toBeGreaterThanOrEqual(MINIMUM_TOUCH_TARGET);
      expect(contrastRatio(labelStyle.color, optionStyle.backgroundColor)).toBeGreaterThanOrEqual(
        MINIMUM_NORMAL_TEXT_CONTRAST,
      );
    }
  });
});

describe('non-colour status regressions', () => {
  test.each([
    ['error', 'Review the highlighted fields.', 'Error', '!'],
    ['success', 'Dose confirmation saved.', 'Success', '✓'],
  ])('%s feedback has a spoken prefix and visible marker', (variant, message, prefix, marker) => {
    const renderer = render(<FormFeedback message={message} variant={variant} />);
    const alert = renderer.root.findByProps({ accessibilityRole: 'alert' });

    expect(alert.props.accessibilityLabel).toBe(`${prefix}: ${message}`);
    expect(renderedText(renderer)).toContain(marker);
  });

  test('clinical alerts announce and display severity and reason without relying on colour', () => {
    const reason = 'Three or more recorded seizures occurred in the selected weekly period.';
    const renderer = render(
      <ClinicalAlertList
        alerts={[{ id: 'SEIZURE_FREQUENCY', severity: 'HIGH', reason, ruleVersion: '1.0' }]}
      />,
    );
    const item = renderer.root.findByProps({ accessibilityRole: 'listitem' });
    const visibleText = renderedText(renderer);
    const severityText = nodeText(
      item.find(
        (node) => node.props.style?.fontWeight === '800' && nodeText(node).includes('HIGH'),
      ),
    );

    expect(item.props.accessibilityLabel).toBe(`HIGH severity alert. ${reason}`);
    expect(severityText).toContain('[HIGH]');
    expect(visibleText).toContain(reason);
    expect(visibleText).toMatch(/informational|not diagnoses|emergency/i);
  });
});
