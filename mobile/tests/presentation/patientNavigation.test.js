import { act, create } from 'react-test-renderer';

import PatientTabsLayout from '../../app/(patient)/(tabs)/_layout.js';

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
    expect(screens.map((screen) => screen.props.options.tabBarLabel)).toEqual([
      'Home',
      'Records',
      'Treatments',
      'Sharing',
    ]);

    for (const screen of screens) {
      let iconRenderer;

      act(() => {
        iconRenderer = create(screen.props.options.tabBarIcon({ color: '#175CD3' }));
      });

      expect(iconRenderer.root.findByType('Text').props.children).toBeTruthy();
    }
  });
});
