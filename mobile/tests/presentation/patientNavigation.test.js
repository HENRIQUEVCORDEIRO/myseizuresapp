import { act, create } from 'react-test-renderer';

import PatientTabsLayout from '../../app/(patient)/(tabs)/_layout.js';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('expo-router', () => {
  const ReactModule = require('react');

  const Tabs = ({ children, screenOptions }) =>
    ReactModule.createElement(
      'Tabs',
      { screenOptions },
      ReactModule.createElement('TabHost', { children }),
    );

  Tabs.Screen = ({ children, name, options }) =>
    ReactModule.createElement(
      'TabScreen',
      { name, options },
      ReactModule.createElement('TabHost', { children }),
    );

  return { Tabs };
});

describe('patient tab navigation', () => {
  test('exposes the four patient destinations with a visible label and an icon', () => {
    let renderer;

    act(() => {
      renderer = create(<PatientTabsLayout />);
    });

    const screens = renderer.root.findAllByType('TabScreen');

    expect(screens.map((screen) => screen.props.name)).toEqual([
      'index',
      'calendar',
      'treatments',
      'sharing',
    ]);
    expect(
      screens.map((screen) => {
        let labelRenderer;

        act(() => {
          labelRenderer = create(screen.props.options.tabBarLabel({ color: '#175CD3' }));
        });

        const label = labelRenderer.root.findByType('Text');

        expect(label.props.maxFontSizeMultiplier).toBe(1.2);

        return label.props.children;
      }),
    ).toEqual(['Início', 'Registros', 'Tratamentos', 'Compartilhar']);
    expect(screens.map((screen) => screen.props.options.tabBarAccessibilityLabel)).toEqual([
      'Início',
      'Registros',
      'Tratamentos',
      'Compartilhamento',
    ]);

    for (const screen of screens) {
      let iconRenderer;

      act(() => {
        iconRenderer = create(screen.props.options.tabBarIcon({ color: '#175CD3' }));
      });

      const icon = iconRenderer.root.findByType('Text');

      expect(icon.props.children).toBeTruthy();
      expect(icon.props.maxFontSizeMultiplier).toBe(1.2);
    }
  });
});
